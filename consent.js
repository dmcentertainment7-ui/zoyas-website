/* Zoya's Wellness Center — cookie consent (Blush & Stone)
   TOZO LLC · v1.1 · 2026-09-10
   ---------------------------------------------------------------
   Nothing in the analytics or advertising categories loads until the
   visitor accepts. Choice is stored for 12 months in localStorage.
   Footer link to reopen:  onclick="zwcConsent.reopen();return false;"
   --------------------------------------------------------------- */
(function () {
  'use strict';

  /* ======== 1. CONFIG — put your IDs here, leave blank to disable ======== */
  var CONFIG = {
    metaPixelId: '',      // e.g. '1234567890'  — Meta (Facebook/Instagram) Pixel
    ga4Id:       '',      // e.g. 'G-XXXXXXXXXX' — Google Analytics 4
    policyUrl:   'privacy.html',
    months:      12       // how long a choice is remembered
  };
  /* ====================================================================== */

  var KEY = 'zwc_consent_v1';
  var el, backdrop;

  /* ---------- copy ---------- */
  var T = {
    en: {
      title: 'We use cookies',
      body: 'Some keep the site working. Others help us see which pages are useful and measure our ads. Nothing beyond the essentials runs until you say yes.',
      link: 'Read our Privacy Policy',
      all: 'Accept all',
      ess: 'Essential only',
      saved: 'Saved'
    },
    mn: {
      title: 'Бид күүки ашигладаг',
      body: 'Зарим нь сайтыг ажиллуулахад шаардлагатай. Бусад нь аль хуудас хэрэгтэйг харах, зар сурталчилгааг хэмжихэд тусална. Таныг зөвшөөрөх хүртэл зайлшгүй шаардлагатайгаас өөр юу ч ажиллахгүй.',
      link: 'Нууцлалын бодлого',
      all: 'Бүгдийг зөвшөөрөх',
      ess: 'Зөвхөн шаардлагатайг',
      saved: 'Хадгаллаа'
    }
  };
  var lang = 'en';
  function pickLang() {
    var d = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    if (d.indexOf('mn') === 0) return 'mn';
    if (d.indexOf('en') === 0) return 'en';
    try { var s = localStorage.getItem('zw_lang'); if (s === 'mn' || s === 'en') return s; } catch (e) {}
    var n = (navigator.language || '').toLowerCase();
    return n.indexOf('mn') === 0 ? 'mn' : 'en';
  }

  /* ---------- storage ---------- */
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      var age = (Date.now() - v.t) / 86400000;
      if (age > CONFIG.months * 30.5) return null;   // expired, ask again
      return v;
    } catch (e) { return null; }
  }
  function write(granted) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, granted: !!granted, t: Date.now() }));
    } catch (e) { /* private mode — choice applies to this page view only */ }
  }

  /* ---------- the trackers, loaded ONLY after consent ---------- */
  var loaded = false;
  function loadTrackers() {
    if (loaded) return;
    loaded = true;

    if (CONFIG.metaPixelId) {
      /* Meta Pixel */
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', CONFIG.metaPixelId);
      window.fbq('track', 'PageView');
    }

    if (CONFIG.ga4Id) {
      var g = document.createElement('script');
      g.async = true;
      g.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4Id;
      document.head.appendChild(g);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', CONFIG.ga4Id, { anonymize_ip: true });
    }

    document.dispatchEvent(new CustomEvent('zwc:consent-granted'));
  }

  /* ---------- styles ---------- */
  function injectCSS() {
    if (document.getElementById('zwc-consent-css')) return;
    var s = document.createElement('style');
    s.id = 'zwc-consent-css';
    s.textContent = [
      '#zwc-cc{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;',
      'display:flex;justify-content:center;padding:0 .85rem 1.05rem;',
      'font-family:Montserrat,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;',
      'animation:zwc-up .42s cubic-bezier(.22,1,.36,1) both}',
      '@keyframes zwc-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
      '#zwc-cc .p{position:relative;isolation:isolate;max-width:660px;width:100%;',
      'border-radius:24px;padding:1.25rem 1.4rem;color:#453B36;overflow:hidden;',
      'background:radial-gradient(120% 190% at 3% -12%,rgba(231,198,194,.95),rgba(231,198,194,0) 56%),',
      'radial-gradient(110% 170% at 100% 115%,rgba(156,95,63,.24),rgba(156,95,63,0) 60%),',
      'linear-gradient(135deg,#F1E2DC 0%,#FAF5F0 58%,#EFD9D5 100%);',
      'box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 22px 54px -26px rgba(69,59,54,.55);',
      '-webkit-backdrop-filter:blur(14px) saturate(1.5);backdrop-filter:blur(14px) saturate(1.5)}',
      '#zwc-cc h2{font-family:"Bodoni Moda",Prata,Georgia,serif;font-weight:400;',
      'font-size:19px;margin:0 0 .35rem;letter-spacing:.005em}',
      '#zwc-cc p{margin:0 0 .95rem;font-size:13px;line-height:1.62;color:#5C4E47}',
      '#zwc-cc a.pl{color:#9C5F3F;text-decoration:underline}',
      '#zwc-cc .r{display:flex;gap:.6rem;flex-wrap:wrap;align-items:center}',
      '#zwc-cc button{font:inherit;font-size:11px;letter-spacing:.15em;text-transform:uppercase;',
      'border-radius:999px;padding:.75rem 1.5rem;cursor:pointer;transition:.22s;border:1px solid transparent}',
      '#zwc-cc .a{background:#453B36;color:#F5F0EA}',
      '#zwc-cc .a:hover{background:#9C5F3F}',
      '#zwc-cc .b{background:rgba(255,255,255,.55);color:#453B36;border-color:rgba(69,59,54,.22)}',
      '#zwc-cc .b:hover{background:rgba(255,255,255,.85)}',
      '@media(max-width:520px){#zwc-cc .r{flex-direction:column;align-items:stretch}',
      '#zwc-cc button{width:100%}}',
      '@media(prefers-reduced-motion:reduce){#zwc-cc{animation:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---------- banner ---------- */
  function show() {
    injectCSS();
    lang = pickLang();
    var t = T[lang];
    if (el) { el.remove(); el = null; }
    el = document.createElement('div');
    el.id = 'zwc-cc';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', t.title);
    el.innerHTML =
      '<div class="p">' +
        '<h2></h2>' +
        '<p><span class="bd"></span> <a class="pl" href="' + CONFIG.policyUrl + '"></a></p>' +
        '<div class="r">' +
          '<button type="button" class="a" data-x="all"></button>' +
          '<button type="button" class="b" data-x="ess"></button>' +
        '</div>' +
      '</div>';
    el.querySelector('h2').textContent = t.title;
    el.querySelector('.bd').textContent = t.body;
    el.querySelector('.pl').textContent = t.link;
    el.querySelector('[data-x="all"]').textContent = t.all;
    el.querySelector('[data-x="ess"]').textContent = t.ess;

    el.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-x]');
      if (!b) return;
      decide(b.getAttribute('data-x') === 'all');
    });
    document.body.appendChild(el);
  }

  function hide() { if (el) { el.remove(); el = null; } }

  function decide(granted) {
    write(granted);
    hide();
    if (granted) loadTrackers();
  }

  /* ---------- public API ---------- */
  window.zwcConsent = {
    reopen: function () { show(); },
    granted: function () { var v = read(); return !!(v && v.granted); },
    revoke: function () { try { localStorage.removeItem(KEY); } catch (e) {} show(); },
    setLang: function (l) { lang = (l === 'mn') ? 'mn' : 'en'; if (el) show(); }
  };

  /* ---------- boot ---------- */
  function boot() {
    /* No analytics or ad pixel configured yet → nothing to consent to, so don't
       interrupt the visitor. The footer "Cookie settings" link still opens the
       banner, and it starts showing automatically once an ID is filled in above. */
    if (!CONFIG.metaPixelId && !CONFIG.ga4Id) return;
    var v = read();
    if (v === null) { show(); return; }     // never asked, or expired
    if (v.granted) loadTrackers();          // previously accepted
    // previously declined: load nothing, show nothing
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
