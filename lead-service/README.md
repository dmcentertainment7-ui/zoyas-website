# Zoya's Lead Service — Railway deploy

Standalone replacement for the n8n webhook (`ZWC 02 · Website Lead Capture`).
Same job — the on-site booking form posts here — but this runs on its own,
24/7, with no dependency on n8n or on anyone's laptop being open.

Tested locally before this was written: valid lead → 200, honeypot → 400,
missing phone → 400, oversized body → 413 (server survives and keeps
serving), malformed JSON → 400, CORS preflight → 204.

## What it is

One file (`server.js`), no dependencies, no database. Node's built-in
`http` module only. Leads are appended to `leads.jsonl` — one JSON object
per line, never mutated after insert, always `status: "requested"` (never
`"confirmed"` — the 30% deposit and human confirmation still gate every
real booking, so this can never double-book against Square or GlossGenius).

## Deploy — click by click

This lives at `lead-service/` inside the **same repo as the website**
(`dmcentertainment7-ui/zoyas-website`), so there's nothing new to create.

1. Go to **railway.app** → sign in → **New Project** → **Deploy from GitHub repo**.
2. Pick **`dmcentertainment7-ui/zoyas-website`**.
3. Once the service is created, open its **Settings** tab:
   - **Root Directory** → set to `lead-service`
   - **Start Command** → leave as default (`npm start`, from `package.json`)
4. Open the **Variables** tab and add:
   - `ALLOWED_ORIGIN` = `https://zoyaswellnesscenter.com`
   - `DATA_DIR` = `/data` *(only if you attach a volume — step 6)*
5. Open **Settings → Networking** → **Generate Domain**. Railway gives you a
   URL like `zoya-lead-service-production.up.railway.app`. Copy it — you'll
   need it in step 8.
6. **Attach a volume** (so `leads.jsonl` survives a redeploy):
   - Service → **Volumes** → **New Volume**
   - Mount path: `/data`
   - This is what `DATA_DIR=/data` in step 4 points at. Skip this and leads
     still work, but a redeploy wipes the file — fine to skip at first, do
     it before this matters for real.
7. Railway deploys automatically on push. Check the **Deployments** tab —
   it should say "Success" within a minute or two of connecting.
8. **Verify it's alive:**
   ```bash
   curl https://YOUR-RAILWAY-URL.up.railway.app/healthz
   # -> {"ok":true,"service":"zoya-lead-service"}
   ```
9. **Tell me the URL from step 5.** I'll update the booking form on the live
   site to point at it instead of the n8n webhook, and n8n comes off the
   critical path for good. Don't disconnect n8n yourself before that swap —
   the form would silently stop capturing leads in between.

## Optional: get a notification instead of checking a file

Set the `NOTIFY_WEBHOOK_URL` variable to any URL that accepts a POST with
`{ text, lead }` — a Telegram bot's webhook, a Slack incoming webhook,
whatever you already have. Without it, `leads.jsonl` is still the complete
record; you'd just have to open it to see new leads, the same blind spot
the n8n data table already has.

## Reading the leads later

```bash
# on the Railway box, or after downloading leads.jsonl
cat leads.jsonl | python3 -c "import json,sys; [print(json.dumps(json.loads(l), indent=2)) for l in sys.stdin]"
```

Or ask me — once this is live I can add a small authenticated `/leads`
endpoint if checking a raw file gets old.
