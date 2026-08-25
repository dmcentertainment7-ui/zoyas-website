#!/usr/bin/env node
/**
 * Zoya's Wellness Center — lead capture service
 * ================================================
 * Replaces the n8n webhook (ZWC 02 · Website Lead Capture) so the on-site
 * booking form no longer depends on n8n, or on anyone's laptop being open.
 * Deploy target: Railway (or any Node host — no platform-specific code).
 *
 * Same contract as the n8n workflow it replaces:
 *   POST /zoya-lead  { name, phone, email, service, preferred_at,
 *                       language, note, consent, company }
 *   -> 200 { ok: true,  lead_id }
 *   -> 400 { ok: false, error: "invalid" }   (bad input or honeypot tripped)
 *
 * Storage: an append-only JSONL file (leads.jsonl) next to this script, on a
 * Railway persistent volume. No database to provision, no ORM, one file a
 * human can `cat` or `grep` directly. Rows are NEVER mutated after insert —
 * they always land as status "requested", never "confirmed": the 30% deposit
 * still holds the chair and a human still confirms the time, so this can
 * never double-book against Square or GlossGenius.
 */

'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || __dirname;
const LEADS_FILE = path.join(DATA_DIR, 'leads.jsonl');
const NOTIFY_WEBHOOK = process.env.NOTIFY_WEBHOOK_URL || ''; // optional: Telegram/Slack/etc via a generic POST
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://zoyaswellnesscenter.com';
const MAX_BODY_BYTES = 8 * 1024; // a lead form is small; refuse anything else outright

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, '');

function clip(v, n) { return (v == null ? '' : String(v)).trim().slice(0, n); }

function normalize(body) {
  const phone = clip(body.phone, 20).replace(/[^0-9+]/g, '');
  const lang = clip(body.language, 8).toLowerCase().startsWith('mn') ? 'mn' : 'en';
  return {
    lead_id: 'web-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
    source: 'website_form',
    name: clip(body.name, 80),
    phone,
    email: clip(body.email, 120).toLowerCase(),
    service: clip(body.service, 80),
    preferred_at: clip(body.preferred_at, 40),
    language: lang,
    note: clip(body.note, 500),
    consent: body.consent === true,
    status: 'requested', // never "confirmed" here — see file header
    received_at: new Date().toISOString(),
    _honeypot: clip(body.company, 200), // real visitors never see or fill this field
  };
}

function isValid(lead) {
  if (lead._honeypot) return false; // bots fill every field; humans can't see this one
  if (!lead.name) return false;
  if (lead.phone.replace(/\D/g, '').length < 9) return false;
  return true;
}

async function notify(lead) {
  if (!NOTIFY_WEBHOOK) return; // no notification configured — the file is the record of truth
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    await fetch(NOTIFY_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `New booking request: ${lead.name} — ${lead.service || 'no service given'} — ${lead.phone}`,
        lead,
      }),
      signal: controller.signal,
    });
    clearTimeout(t);
  } catch (e) {
    // Never let a flaky notification channel fail the lead capture itself.
    console.error('notify failed (lead was still saved):', e.message);
  }
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});

  if (req.method === 'GET' && req.url === '/healthz') {
    return send(res, 200, { ok: true, service: 'zoya-lead-service' });
  }

  if (req.method !== 'POST' || req.url !== '/zoya-lead') {
    return send(res, 404, { ok: false, error: 'not_found' });
  }

  let size = 0;
  let rejected = false;
  const chunks = [];
  req.on('data', (chunk) => {
    if (rejected) return;
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      // Stop buffering and respond; do NOT destroy the socket here — doing so
      // races the client's read of this very response and can turn a clean
      // 413 into a connection reset instead.
      rejected = true;
      chunks.length = 0;
      send(res, 413, { ok: false, error: 'too_large' });
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', async () => {
    if (rejected) return;
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    } catch {
      return send(res, 400, { ok: false, error: 'invalid_json' });
    }

    const lead = normalize(body);
    if (!isValid(lead)) {
      return send(res, 400, { ok: false, error: 'invalid' });
    }

    const record = { ...lead };
    delete record._honeypot;

    try {
      fs.appendFileSync(LEADS_FILE, JSON.stringify(record) + '\n');
    } catch (e) {
      console.error('failed to write lead:', e.message);
      return send(res, 500, { ok: false, error: 'storage_failed' });
    }

    notify(record); // fire-and-forget; response does not wait on it
    return send(res, 200, { ok: true, lead_id: record.lead_id });
  });

  req.on('error', () => send(res, 400, { ok: false, error: 'request_error' }));
});

server.listen(PORT, () => {
  console.log(`zoya-lead-service listening on :${PORT}, writing to ${LEADS_FILE}`);
});
