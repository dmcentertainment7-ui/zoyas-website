
(function(){
  var mq = matchMedia('(prefers-reduced-motion: reduce)');
  var DICT = window.__I18N || {}, SVC = window.__SVC || [], cur = 'en';

  var els = document.querySelectorAll('[data-rv]');
  if (mq.matches) { Array.prototype.forEach.call(els, function(e){ e.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function(en){
      en.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold:.1, rootMargin:'0px 0px -8% 0px' });
    var counts = {};
    Array.prototype.forEach.call(els, function(el){
      var g = el.closest('[data-rvg]');
      if (g){ var k = g.dataset.rvg; counts[k] = counts[k]||0;
              el.style.setProperty('--d', Math.min(counts[k],5)*70+'ms'); counts[k]++; }
      io.observe(el);
    });
  }

  var px = [].slice.call(document.querySelectorAll('[data-px]')), tick = false;
  function onScroll(){
    if(tick) return; tick = true;
    requestAnimationFrame(function(){
      var vh = innerHeight;
      px.forEach(function(el){
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh+80) return;
        var p = (r.top + r.height/2 - vh/2)/vh, img = el.querySelector('img');
        if (img) img.style.transform = 'translate3d(0,'+(p*-7).toFixed(2)+'%,0)';
      });
      tick = false;
    });
  }
  if(!mq.matches){ addEventListener('scroll', onScroll, {passive:true}); onScroll(); }

  var bar = document.querySelector('.bookbar');
  if (bar){
    var barTick = false;
    var syncBar = function(){
      if (barTick) return; barTick = true;
      requestAnimationFrame(function(){
        var foot = document.querySelector('footer');
        var nearFoot = foot && foot.getBoundingClientRect().top < innerHeight - 40;
        bar.classList.toggle('on', scrollY > innerHeight * 0.7 && !nearFoot);
        barTick = false;
      });
    };
    addEventListener('scroll', syncBar, {passive:true});
    addEventListener('resize', syncBar, {passive:true});
    syncBar();
  }

  var sel = document.getElementById('svc'), out = document.getElementById('dep'),
      of = document.getElementById('of'), pay = document.getElementById('pay');

  function render(){
    if(!sel || !out) return;
    var s = SVC[sel.value];
    if(!s){ out.textContent = '—'; if(of) of.textContent = ''; return; }
    out.textContent = '$' + s.d;
    if(of) of.textContent = (tr('calc_of') || 'of') + ' $' + s.p;
  }
  function buildOptions(){
    if(!sel) return;
    var keep = sel.value;
    sel.innerHTML = '';
    var ph = document.createElement('option');
    ph.value = ''; ph.textContent = tr('calc_place') || 'Select a service\u2026';
    sel.appendChild(ph);
    var order = [], by = {};
    SVC.forEach(function(s,i){ if(!by[s.g]){ by[s.g] = []; order.push(s.g); } by[s.g].push([s,i]); });
    order.forEach(function(g){
      var og = document.createElement('optgroup'); og.label = g;
      by[g].forEach(function(pr){
        var o = document.createElement('option');
        o.value = pr[1]; o.textContent = (cur==='mn' ? pr[0].mn : pr[0].en) + ' — $' + pr[0].p;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    sel.value = keep;
    render();
  }
  if (sel) sel.addEventListener('change', render);
  if (pay) pay.addEventListener('click', function(ev){
    if (!pay.dataset.link){
      ev.preventDefault();
      alert('Online deposits are being switched on. Please call ' + pay.dataset.phone + ' and we will hold your appointment.');
    }
  });

  var EN = {}, ENPH = {};
  document.querySelectorAll('[data-i18n]').forEach(function(el){ EN[el.dataset.i18n] = el.innerHTML; });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){ ENPH[el.dataset.i18nPh] = el.getAttribute('placeholder'); });
  function tr(k){ return cur === 'mn' ? (DICT[k] != null ? DICT[k] : EN[k]) : EN[k]; }

  /* ---- word-by-word reveal, the TextEffect 'blur' preset done natively.
     Only panes actually on screen are animated: off-screen copy just swaps,
     which keeps a full retranslation cheap however long the page gets. ---- */
  var teMo = matchMedia('(prefers-reduced-motion: reduce)');
  function teReveal(el, start){
    if (teMo.matches) return start;
    var r = el.getBoundingClientRect();
    if (r.bottom < -40 || r.top > innerHeight + 40 || !r.width) return start;
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walk.nextNode())) if (n.nodeValue.trim()) nodes.push(n);
    var i = start;
    nodes.forEach(function(node){
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function(w){
        if (!w) return;
        if (!w.trim()){ frag.appendChild(document.createTextNode(w)); return; }
        var s = document.createElement('span');
        s.className = 'te__w'; s.style.setProperty('--i', i++); s.textContent = w;
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return i;
  }

  function setLang(l, animate){
    cur = l;
    document.documentElement.lang = (l === 'mn' ? 'mn' : 'en');
    var step = 0;
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var v = (l === 'mn') ? DICT[el.dataset.i18n] : EN[el.dataset.i18n];
      if (v == null) return;
      el.innerHTML = v;
      if (animate) step = teReveal(el, step);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
      var v = (l === 'mn') ? DICT[el.dataset.i18nPh] : ENPH[el.dataset.i18nPh];
      if (v != null) el.setAttribute('placeholder', v);
    });
    document.querySelectorAll('.lang button').forEach(function(b){
      b.setAttribute('aria-pressed', String(b.dataset.lang === l));
    });
    document.querySelectorAll('.lang').forEach(function(w){
      w.classList.toggle('mn', l === 'mn');
      if (animate){                       /* restart the squash on every throw */
        w.classList.remove('go'); void w.offsetWidth; w.classList.add('go');
      }
    });
    buildOptions();
    try { localStorage.setItem('zw_lang', l); } catch(e){}
  }
  document.querySelectorAll('.lang button').forEach(function(b){
    b.addEventListener('click', function(){
      if (b.dataset.lang !== cur) setLang(b.dataset.lang, true);
    });
  });

  var form = document.getElementById('subscribe');
  if (form) form.addEventListener('submit', function(ev){
    if (!form.getAttribute('action')){
      ev.preventDefault();
      var ok = document.getElementById('emok');
      if (ok) ok.style.display = 'block';
      form.reset();
    }
  });

  /* ---- testimonials: one quote at a time, auto-advance, pause on hover ---- */
  var figs = [].slice.call(document.querySelectorAll('.tmq figure')),
      dots = [].slice.call(document.querySelectorAll('.tmdots button')),
      tmI = 0, tmTimer = null;
  function showQuote(n){
    if(!figs.length) return;
    tmI = (n + figs.length) % figs.length;
    figs.forEach(function(f,i){ f.classList.toggle('on', i === tmI); });
    dots.forEach(function(d,i){ d.setAttribute('aria-selected', String(i === tmI)); });
  }
  function startQuotes(){
    if (mq.matches || figs.length < 2) return;
    stopQuotes();
    tmTimer = setInterval(function(){ showQuote(tmI + 1); }, 7000);
  }
  function stopQuotes(){ if(tmTimer){ clearInterval(tmTimer); tmTimer = null; } }
  dots.forEach(function(d,i){
    d.addEventListener('click', function(){ showQuote(i); startQuotes(); });
  });
  var tmWrap = document.getElementById('reviews');
  if (tmWrap){
    tmWrap.addEventListener('mouseenter', stopQuotes);
    tmWrap.addEventListener('mouseleave', startQuotes);
    new IntersectionObserver(function(en){
      if (en[0].isIntersecting) startQuotes(); else stopQuotes();
    },{threshold:.2}).observe(tmWrap);
  }

  /* ---- mobile menu ---- */
  var mb = document.querySelector('.menubtn'), mn = document.getElementById('mobnav');
  if (mb && mn){
    var setMenu = function(open){
      mb.setAttribute('aria-expanded', String(open));
      mn.classList.toggle('on', open);
    };
    mb.addEventListener('click', function(e){
      e.stopPropagation();
      setMenu(mb.getAttribute('aria-expanded') !== 'true');
    });
    mn.addEventListener('click', function(e){ if (e.target.tagName === 'A') setMenu(false); });
    document.addEventListener('click', function(e){
      if (mn.classList.contains('on') && !mn.contains(e.target) && e.target !== mb) setMenu(false);
    });
    addEventListener('keydown', function(e){ if (e.key === 'Escape') setMenu(false); });
  }

  /* ---- email capture popup: 6s timer or exit intent, remembers the answer ---- */
  (function(){
    var ov = document.getElementById('zwov'), pop = document.getElementById('zwpop');
    if (!ov || !pop) return;
    var shown = false, lastFocus = null;
    var put = function(k, v, days){ try{ localStorage.setItem(k, JSON.stringify(
          {v: v, exp: Date.now() + days * 864e5})); }catch(e){} };
    var get = function(k){ try{
          var o = JSON.parse(localStorage.getItem(k) || 'null');
          if (o && o.exp > Date.now()) return o.v;
          localStorage.removeItem(k);
        }catch(e){} return null; };
    if (get('zwDismissed') || get('zwClaimed')) return;

    var open = function(){
      if (shown) return;
      shown = true; lastFocus = document.activeElement;
      ov.hidden = pop.hidden = false;
      requestAnimationFrame(function(){ ov.classList.add('on'); pop.classList.add('on'); });
      setTimeout(function(){ var m = document.getElementById('zwmail'); if (m) m.focus(); }, 400);
    };
    var close = function(days){
      ov.classList.remove('on'); pop.classList.remove('on');
      setTimeout(function(){ ov.hidden = pop.hidden = true; }, 400);
      put('zwDismissed', 1, days || 3);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    [].forEach.call(pop.querySelectorAll('[data-zwclose]'), function(b){
      b.addEventListener('click', function(){ close(3); });
    });
    ov.addEventListener('click', function(){ close(3); });
    addEventListener('keydown', function(e){
      if (e.key === 'Escape' && pop.classList.contains('on')) close(3);
    });

    setTimeout(open, 6000);
    document.addEventListener('mouseout', function(e){
      if (!e.relatedTarget && e.clientY <= 0) open();
    });

    var zwf = document.getElementById('zwf');
    if (zwf) zwf.addEventListener('submit', function(e){
      e.preventDefault();
      var f = document.getElementById('zwmail'), v = f.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v)){ f.focus(); return; }
      if (window.__ML){
        var fd = new FormData();
        fd.append('fields[email]', v);
        fetch(window.__ML, {method:'POST', body: fd, mode:'no-cors'}).catch(function(){});
      }
      pop.classList.add('claimed');
      put('zwClaimed', v, 60);
    });
  })();

  /* ---- lash style accordion ---- */
  var xw = document.querySelector('.xpand');
  if (xw){
    var xps = [].slice.call(xw.querySelectorAll('.xp'));
    var fine = matchMedia('(hover: hover) and (pointer: fine)');
    var setX = function(i){
      xps.forEach(function(p, k){
        var on = k === i;
        p.dataset.on = on ? '1' : '0';
        p.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    };
    xps.forEach(function(p, i){
      p.addEventListener('mouseenter', function(){ if (fine.matches) setX(i); });
      p.addEventListener('focus', function(){ setX(i); });
      p.addEventListener('click', function(e){
        if (e.target.closest('a')) return;      // let the CTA through
        setX(i);
      });
      p.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setX(i); }
        else if (e.key === 'ArrowRight' && xps[i + 1]) xps[i + 1].focus();
        else if (e.key === 'ArrowLeft'  && xps[i - 1]) xps[i - 1].focus();
      });
    });
  }


  /* ---- membership: billing switch + which tier the lead picked ---- */
  var mtg = document.querySelector('.mtg'), mbForm = document.getElementById('mbform');
  if (mtg){
    var mbCycle = document.getElementById('mbcycle');
    var setCycle = function(c){
      mtg.classList.toggle('yr', c === 'yr');
      mtg.classList.remove('go'); void mtg.offsetWidth; mtg.classList.add('go');
      mtg.querySelectorAll('button').forEach(function(b){
        b.setAttribute('aria-pressed', String(b.dataset.cycle === c));
      });
      /* swap any tier that actually has numbers in it yet */
      document.querySelectorAll('.mp__price b').forEach(function(el){
        var v = c === 'yr' ? el.dataset.yr : el.dataset.mo;
        if (v) el.textContent = '$' + v;
      });
      document.querySelectorAll('.mp__per').forEach(function(el){
        el.textContent = c === 'yr' ? '/year' : '/month';
      });
      if (mbCycle) mbCycle.value = (c === 'yr' ? 'yearly' : 'monthly');
    };
    mtg.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click', function(){ setCycle(b.dataset.cycle); });
    });
  }
  /* Picking a tier drives whichever capture is live: the MailerLite form when
     one is connected, otherwise the prefilled text link. */
  var mbSms = document.getElementById('mbsms');
  if (mbForm || mbSms){
    var mbTarget = mbForm || mbSms.closest('.ctarow') || mbSms,
        mbTier = document.getElementById('mbtier'),
        mbPick = document.getElementById('mbpick'),
        mbOk   = document.getElementById('mbok');
    document.querySelectorAll('.mp__cta').forEach(function(btn){
      btn.addEventListener('click', function(){
        var card = btn.closest('.mp'),
            name = card.querySelector('.mp__name').textContent.trim();
        document.querySelectorAll('.mp__cta').forEach(function(b){ b.classList.remove('on'); });
        btn.classList.add('on');
        if (mbTier) mbTier.value = btn.dataset.tier;
        if (mbPick) mbPick.textContent = name;
        if (mbSms) mbSms.href = mbSms.href.split('?')[0] + '?&body=' +
          encodeURIComponent("Hi Zoya's - I'd like to join the membership waitlist for the "
                             + name + " plan.");
        mbTarget.scrollIntoView({block: 'center', behavior: 'smooth'});
        var first = mbForm && mbForm.querySelector('input[type=text]');
        if (first) setTimeout(function(){ first.focus({preventScroll: true}); }, 500);
      });
    });
    if (mbForm) mbForm.addEventListener('submit', function(ev){
      if (!mbForm.getAttribute('action')){
        ev.preventDefault();
        if (mbOk) mbOk.classList.add('on');
        mbForm.reset();
        if (mbPick) mbPick.textContent = '';
        document.querySelectorAll('.mp__cta').forEach(function(b){ b.classList.remove('on'); });
      }
    });
  }

  /* ---- location card: tilts to the cursor, opens into a street plan ---- */
  var lmc = document.querySelector('.lmap__c');
  if (lmc){
    /* open / closed on the shop's clock (America/Chicago), not the visitor's */
    var lmLive = lmc.querySelector('.lmap__live');
    var lmHours = function(){
      var h;
      try {
        h = parseInt(new Intl.DateTimeFormat('en-US', {timeZone:'America/Chicago',
              hour:'2-digit', hour12:false}).format(new Date()), 10);
      } catch (e){ h = new Date().getHours(); }
      if (h === 24) h = 0;
      if (lmLive) lmLive.classList.toggle('shut', !(h >= 8 && h < 20));
    };
    lmHours(); setInterval(lmHours, 60000);

    var lmRaf = 0;
    if (!mq.matches && matchMedia('(hover: hover) and (pointer: fine)').matches){
      lmc.addEventListener('pointermove', function(e){
        if (lmRaf) return;
        lmRaf = requestAnimationFrame(function(){
          lmRaf = 0;
          var r = lmc.getBoundingClientRect(),
              px = (e.clientX - r.left) / r.width  - 0.5,
              py = (e.clientY - r.top)  / r.height - 0.5,
              amt = lmc.classList.contains('on') ? 5 : 9;
          lmc.style.setProperty('--ry', (px * amt).toFixed(2) + 'deg');
          lmc.style.setProperty('--rx', (-py * amt).toFixed(2) + 'deg');
        });
      }, {passive:true});
      lmc.addEventListener('pointerleave', function(){
        lmc.style.setProperty('--rx', '0deg');
        lmc.style.setProperty('--ry', '0deg');
      });
    }

    var lmSet = function(on){
      lmc.classList.toggle('on', on);
      lmc.setAttribute('aria-expanded', on ? 'true' : 'false');
    };
    lmc.addEventListener('click', function(e){
      if (e.target.closest && e.target.closest('a')) return;   // let directions through
      lmSet(!lmc.classList.contains('on'));
    });
    lmc.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault(); lmSet(!lmc.classList.contains('on'));
      } else if (e.key === 'Escape') lmSet(false);
    });
  }

  /* ---- photo cursor trail: site-wide, fixed layer, never blocks a click ---- */
  var pt = document.getElementById('ptrail');
  if (pt && !mq.matches && matchMedia('(hover: hover) and (pointer: fine)').matches){
    var pImgs = [].slice.call(pt.querySelectorAll('img')),
        pIdx = 0, pLast = null, pTimers = [];
    /* fetch the trail photos after the page is painted, a few at a time,
       so they never compete with the hero or block first render */
    var pWarm = function(){
      var q = pImgs.slice(), pump = function(){
        var im = q.shift(); if (!im) return;
        if (im.dataset.src){ im.src = im.dataset.src; im.removeAttribute('data-src'); }
        im.complete ? pump() : (im.onload = im.onerror = pump);
      };
      pump(); pump(); pump();
    };
    (document.readyState === 'complete') ? setTimeout(pWarm, 400)
      : addEventListener('load', function(){ setTimeout(pWarm, 400); });
    var pGap = function(){ return Math.min(Math.max(innerWidth / 16, 78), 120); };
    /* the layer is fixed and full-viewport so photos are never clipped, but
       they only appear while the cursor is inside a [data-trail] section */
    var pClear = function(){ pImgs.forEach(function(im){ im.dataset.on = '0'; }); };
    var pInZone = function(x, y){
      var el = document.elementFromPoint(x, y);
      return !!(el && el.closest && el.closest('[data-trail]'));
    };
    addEventListener('pointermove', function(e){
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!pInZone(e.clientX, e.clientY)){ pLast = null; pClear(); return; }
      if (pLast === null){ pLast = {x: e.clientX, y: e.clientY}; return; }
      var dx = e.clientX - pLast.x, dy = e.clientY - pLast.y;
      if (Math.sqrt(dx*dx + dy*dy) < pGap()) return;
      pLast = {x: e.clientX, y: e.clientY};
      var slot = pIdx % pImgs.length, img = pImgs[slot];
      img.style.left = e.clientX + 'px';
      img.style.top  = e.clientY + 'px';
      img.style.zIndex = String(slot + 1);
      img.dataset.on = '1';
      clearTimeout(pTimers[slot]);
      pTimers[slot] = setTimeout(function(){ img.dataset.on = '0'; }, 850);
      pIdx++;
    }, {passive: true});
    // clear everything when the cursor leaves the window entirely
    document.addEventListener('mouseleave', pClear);
    addEventListener('scroll', function(){
      if (pLast && !pInZone(pLast.x, pLast.y)){ pLast = null; pClear(); }
    }, {passive: true});
  }

  /* ---- hero image expands with natural scroll (no scroll hijacking) ---- */
  var heroImg = document.querySelector('.hero__img'), heroTick = false;
  if (heroImg && !mq.matches && !matchMedia('(max-width: 900px)').matches){
    var growHero = function(){
      if (heroTick) return; heroTick = true;
      requestAnimationFrame(function(){
        var p = Math.min(Math.max(scrollY / (innerHeight * 0.9), 0), 1);
        var eased = 1 - Math.pow(1 - p, 3);
        heroImg.style.transform = 'scale(' + (1 + eased * 0.06).toFixed(4) + ')';
        heroImg.style.transformOrigin = '100% 30%';
        heroTick = false;
      });
    };
    addEventListener('scroll', growHero, {passive:true});
    growHero();
  }

  try { cur = localStorage.getItem('zw_lang') || 'en'; } catch(e){}
  setLang(cur, false);

})();
