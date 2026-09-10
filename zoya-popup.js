/* Zoya's Wellness Center — email capture popup → Klaviyo
   Blush & Stone · liquid glass · EN/MN · v2 (site build) · 2026-09-10
   ---------------------------------------------------------------
   Drop this one file on the site:  <script src="zoya-popup.js" defer></script>
   Fill in CONFIG. Nothing else to wire.
   --------------------------------------------------------------- */
(function () {
  'use strict';

  /* ================= CONFIG — already filled for Zoya's ================= */
  var CONFIG = {
    klaviyoCompanyId: 'WjGGjA',  // Klaviyo public API key / Site ID (Zoya's account)
    klaviyoListId:    'ViUTPu',  // list "Website — Welcome 20%" (double opt-in)
    n8nMirror:        'https://temuulen838.app.n8n.cloud/webhook/zoya-lead', // '' to disable
    privacyUrl:       '/privacy.html',
    delaySeconds:     8,         // show after N seconds …
    scrollPercent:    45,        // … or after scrolling this far …
    exitIntent:       true,      // … or when the cursor leaves the top of the window
    snoozeDays:       14,        // don't show again after dismiss
    revision:         '2026-07-15'
  };
  /* ============================================================= */

  var KEY_DONE = 'zwc_pop_done', KEY_SNOOZE = 'zwc_pop_snooze';
  var shown = false, el = null, lang = 'en';

  var T = {
    en: {
      kicker: 'Before you go',
      title: 'Don’t lose your 20%',
      body: 'Your first visit is 20% off — but only if we have your email. Leave it here and the offer is yours.',
      ph_name: 'First name',
      ph_email: 'Email address',
      cta: 'Keep my 20%',
      consent: 'By continuing you agree to receive emails from Zoya’s. Unsubscribe any time.',
      privacy: 'Privacy Policy',
      later: 'No thanks, I’ll pay full price',
      ok_title: 'Check your inbox',
      ok_body: 'We’ve sent a confirmation. Tap the link inside and your 20% is locked in.',
      err: 'That didn’t go through. Check the email and try again.',
      close: 'Close'
    },
    mn: {
      kicker: 'Гарахаасаа өмнө',
      title: '20%-иа алдаж болохгүй',
      body: 'Анхны айлчлал тань 20% хөнгөлөлттэй — гэхдээ зөвхөн и-мэйлээ үлдээвэл. Энд бичээд хөнгөлөлтөө аваарай.',
      ph_name: 'Нэр',
      ph_email: 'И-мэйл хаяг',
      cta: '20%-иа авах',
      consent: 'Үргэлжлүүлснээр та Zoya’s-аас и-мэйл хүлээн авахыг зөвшөөрч байна. Хүссэн үедээ татгалзаж болно.',
      privacy: 'Нууцлалын бодлого',
      later: 'Үгүй, бүтэн үнээр нь авъя',
      ok_title: 'И-мэйлээ шалгана уу',
      ok_body: 'Баталгаажуулах захидал илгээлээ. Доторх холбоосыг дарвал 20% тань баталгаажна.',
      err: 'Илгээгдсэнгүй. И-мэйлээ шалгаад дахин оролдоно уу.',
      close: 'Хаах'
    }
  };

  function pickLang() {
    var d = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    if (d.indexOf('mn') === 0) return 'mn';
    if (d.indexOf('en') === 0) return 'en';
    try { var s = localStorage.getItem('zw_lang') || localStorage.getItem('zwc_lang'); if (s === 'mn' || s === 'en') return s; } catch (e) {}
    return 'en';
  }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function blocked() {
    if (ls(KEY_DONE)) return true;
    var s = parseInt(ls(KEY_SNOOZE) || '0', 10);
    return s && Date.now() < s;
  }

  /* ---------- CSS ---------- */
  function css() {
    if (document.getElementById('zwc-pop-css')) return;
    var s = document.createElement('style'); s.id = 'zwc-pop-css';
    s.textContent = [
      '#zwc-pop{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:center;justify-content:center;padding:1.2rem;',
      'background:rgba(69,59,54,.42);-webkit-backdrop-filter:blur(10px) saturate(1.2);backdrop-filter:blur(10px) saturate(1.2);',
      'animation:zwc-fade .35s ease both;font-family:Montserrat,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}',
      '@keyframes zwc-fade{from{opacity:0}to{opacity:1}}',
      '@keyframes zwc-rise{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:none}}',
      '#zwc-pop .c{position:relative;isolation:isolate;width:100%;max-width:440px;border-radius:30px;overflow:hidden;',
      'padding:2.2rem 2.1rem 1.8rem;color:#453B36;animation:zwc-rise .5s cubic-bezier(.22,1,.36,1) both;',
      'background:radial-gradient(120% 190% at 3% -12%,rgba(231,198,194,.95),rgba(231,198,194,0) 56%),',
      'radial-gradient(110% 170% at 100% 115%,rgba(156,95,63,.26),rgba(156,95,63,0) 60%),',
      'linear-gradient(135deg,#F1E2DC 0%,#FAF5F0 58%,#EFD9D5 100%);',
      'border:1px solid rgba(255,255,255,.8);',
      'box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(156,95,63,.12),0 30px 70px -30px rgba(30,22,18,.7)}',
      '#zwc-pop .c::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;',
      'background:linear-gradient(115deg,rgba(255,255,255,.0) 30%,rgba(255,255,255,.55) 46%,rgba(255,255,255,.0) 60%);mix-blend-mode:screen}',
      '#zwc-pop .x{position:absolute;top:.9rem;right:.9rem;width:2.1rem;height:2.1rem;border-radius:50%;border:1px solid rgba(69,59,54,.18);',
      'background:rgba(255,255,255,.5);color:#453B36;font-size:15px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}',
      '#zwc-pop .x:hover{background:#fff}',
      '#zwc-pop .k{font-size:9.5px;letter-spacing:.38em;text-indent:.38em;text-transform:uppercase;color:#9C5F3F;margin:0 0 .75rem}',
      '#zwc-pop h2{font-family:"Bodoni Moda",Prata,Georgia,serif;font-weight:400;font-size:30px;line-height:1.1;margin:0 0 .75rem;letter-spacing:.005em}',
      '#zwc-pop .mn h2{font-family:Prata,"Bodoni Moda",Georgia,serif;font-size:26px}',
      '#zwc-pop p{margin:0 0 1.15rem;font-size:14px;line-height:1.6;color:#5C4E47}',
      '#zwc-pop input{width:100%;box-sizing:border-box;font:inherit;font-size:14.5px;color:#453B36;padding:.85rem 1.05rem;margin:0 0 .6rem;',
      'border-radius:999px;border:1px solid rgba(69,59,54,.2);background:rgba(255,255,255,.72);outline:none;transition:.2s}',
      '#zwc-pop input:focus{border-color:#9C5F3F;background:#fff;box-shadow:0 0 0 3px rgba(156,95,63,.14)}',
      '#zwc-pop input::placeholder{color:#8F817A}',
      '#zwc-pop .hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}',
      '#zwc-pop button.go{width:100%;font:inherit;font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:500;',
      'color:#F5F0EA;background:linear-gradient(135deg,#9C5F3F,#C08560);border:0;border-radius:999px;padding:.95rem 1.4rem;cursor:pointer;margin:.3rem 0 .85rem;',
      'box-shadow:0 12px 26px -14px rgba(156,95,63,.9);transition:.22s}',
      '#zwc-pop button.go:hover{filter:brightness(1.06);transform:translateY(-1px)}',
      '#zwc-pop button.go[disabled]{opacity:.6;cursor:wait;transform:none}',
      '#zwc-pop .s{font-size:11px;line-height:1.55;color:#6E5F57;margin:0 0 .9rem}',
      '#zwc-pop .s a{color:#9C5F3F}',
      '#zwc-pop .l{display:block;text-align:center;font-size:11.5px;color:#6E5F57;background:none;border:0;cursor:pointer;',
      'text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(110,95,87,.4);font-family:inherit;width:100%}',
      '#zwc-pop .l:hover{color:#453B36}',
      '#zwc-pop .e{display:none;font-size:12px;color:#9C5F3F;margin:-.2rem 0 .7rem}',
      '#zwc-pop .ok{text-align:center;padding:.6rem 0 .4rem}',
      '#zwc-pop .ok .m{width:56px;height:56px;border-radius:50%;background:#453B36;color:#F5F0EA;display:flex;align-items:center;justify-content:center;',
      'margin:0 auto 1.1rem;font-size:22px}',
      '@media(max-width:480px){#zwc-pop .c{padding:1.9rem 1.4rem 1.5rem;border-radius:24px}#zwc-pop h2{font-size:26px}}',
      '@media(prefers-reduced-motion:reduce){#zwc-pop,#zwc-pop .c{animation:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---------- render ---------- */
  function render() {
    if (el) close();                                                   /* never two at once */
    css(); lang = pickLang(); var t = T[lang];
    el = document.createElement('div'); el.id = 'zwc-pop';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', t.title);
    el.innerHTML =
      '<div class="c ' + lang + '">' +
        '<button type="button" class="x" aria-label="' + t.close + '">&#215;</button>' +
        '<div class="form">' +
          '<p class="k">' + t.kicker + '</p>' +
          '<h2>' + t.title + '</h2>' +
          '<p>' + t.body + '</p>' +
          '<form novalidate>' +
            '<input type="text" name="first_name" placeholder="' + t.ph_name + '" autocomplete="given-name">' +
            '<input type="email" name="email" placeholder="' + t.ph_email + '" autocomplete="email" required>' +
            '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off">' +
            '<div class="e"></div>' +
            '<button type="submit" class="go">' + t.cta + '</button>' +
          '</form>' +
          '<p class="s">' + t.consent + ' <a href="' + CONFIG.privacyUrl + '" target="_blank" rel="noopener">' + t.privacy + '</a></p>' +
          '<button type="button" class="l">' + t.later + '</button>' +
        '</div>' +
        '<div class="ok" hidden>' +
          '<div class="m">&#10003;</div>' +
          '<h2>' + t.ok_title + '</h2>' +
          '<p>' + t.ok_body + '</p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    document.body.style.overflow = 'hidden';

    el.querySelector('.x').addEventListener('click', snooze);
    el.querySelector('.l').addEventListener('click', snooze);
    el.addEventListener('click', function (e) { if (e.target === el) snooze(); });
    document.addEventListener('keydown', esc);
    el.querySelector('form').addEventListener('submit', submit);
    setTimeout(function () { var i = el.querySelector('input[name=email]'); if (i) i.focus({ preventScroll: true }); }, 380);
  }
  function esc(e) { if (e.key === 'Escape') snooze(); }
  /* follow the site's EN/MN toggle live */
  try { new MutationObserver(function () { if (el && pickLang() !== lang) { close(); shown = false; show(); } })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] }); } catch (e) {}
  function close() {
    if (!el) return; el.remove(); el = null;
    document.body.style.overflow = ''; document.removeEventListener('keydown', esc);
  }
  function snooze() { lsSet(KEY_SNOOZE, String(Date.now() + CONFIG.snoozeDays * 86400000)); close(); }

  /* ---------- Klaviyo subscribe (+ n8n mirror) — shared by popup and #offer form ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function subscribe(email, name, source) {
    var l = pickLang();
    var body = {
      data: {
        type: 'subscription',
        attributes: {
          custom_source: 'Website ' + source + ' (' + l + ')',
          profile: { data: { type: 'profile', attributes: {
            email: email,
            first_name: name || undefined,
            properties: { language: l, source: 'website_' + source },
            subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } }
          } } }
        },
        relationships: { list: { data: { type: 'list', id: CONFIG.klaviyoListId } } }
      }
    };
    return fetch('https://a.klaviyo.com/client/subscriptions/?company_id=' + encodeURIComponent(CONFIG.klaviyoCompanyId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/vnd.api+json', 'revision': CONFIG.revision },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!(r.status === 202 || r.ok)) throw new Error('klaviyo ' + r.status);
      if (CONFIG.n8nMirror) {                                          /* keep your own copy of the lead */
        try { fetch(CONFIG.n8nMirror, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'website_' + source, email: email, name: name || '', lang: l, consent: 'email_marketing', ts: new Date().toISOString() }) }); } catch (x) {}
      }
      lsSet(KEY_DONE, '1');                                            /* subscribed once → popup never nags again */
      return true;
    });
  }

  function submit(e) {
    e.preventDefault();
    var f = e.target, t = T[lang];
    var email = (f.email.value || '').trim(), name = (f.first_name.value || '').trim();
    var err = el.querySelector('.e'), btn = f.querySelector('.go');
    if (f.website.value) { return; }                                   /* honeypot */
    if (!EMAIL_RE.test(email)) { err.textContent = t.err; err.style.display = 'block'; return; }
    err.style.display = 'none'; btn.disabled = true;
    subscribe(email, name, 'popup').then(function () {
      el.querySelector('.form').hidden = true;
      el.querySelector('.ok').hidden = false;
      setTimeout(close, 6500);
    }).catch(function () {
      btn.disabled = false; err.textContent = t.err; err.style.display = 'block';
    });
  }

  /* ---------- the on-page form in #offer (same list, same double opt-in) ---------- */
  function wireOffer() {
    var f = document.getElementById('zwc-offer'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = f.querySelector('input[type=email]'), btn = f.querySelector('button'), ok = f.parentNode.querySelector('.ok'), err = f.parentNode.querySelector('.err');
      var hp = f.querySelector('input[name=website]'); if (hp && hp.value) return;
      var email = (inp.value || '').trim();
      if (!EMAIL_RE.test(email)) { inp.focus(); if (err) { err.textContent = T[pickLang()].err; err.style.display = 'block'; } return; }
      if (err) err.style.display = 'none';
      btn.disabled = true;
      subscribe(email, '', 'offer').then(function () {
        f.hidden = true; if (ok) ok.style.display = 'block';
      }).catch(function () {
        btn.disabled = false; if (err) { err.textContent = T[pickLang()].err; err.style.display = 'block'; }
      });
    });
  }

  /* ---------- triggers ---------- */
  function show() { if (shown || blocked() || !CONFIG.klaviyoCompanyId || !CONFIG.klaviyoListId) return; shown = true; render(); }
  function arm() {
    if (blocked()) return;
    setTimeout(show, CONFIG.delaySeconds * 1000);
    window.addEventListener('scroll', function onS() {
      var h = document.documentElement, p = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      if (p >= CONFIG.scrollPercent) { window.removeEventListener('scroll', onS); show(); }
    }, { passive: true });
    if (CONFIG.exitIntent) document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget && e.clientY <= 0) show();
    });
  }

  window.zwcPopup = {
    open: function () { shown = true; render(); },
    subscribe: subscribe,
    setLang: function (l) { lang = l === 'mn' ? 'mn' : 'en'; lsSet('zwc_lang', lang); if (el) { close(); shown = false; show(); } },
    reset: function () { try { localStorage.removeItem(KEY_DONE); localStorage.removeItem(KEY_SNOOZE); } catch (e) {} }
  };

  function boot() { wireOffer(); arm(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
