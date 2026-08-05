
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

  function setLang(l){
    cur = l;
    document.documentElement.lang = (l === 'mn' ? 'mn' : 'en');
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var v = (l === 'mn') ? DICT[el.dataset.i18n] : EN[el.dataset.i18n];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
      var v = (l === 'mn') ? DICT[el.dataset.i18nPh] : ENPH[el.dataset.i18nPh];
      if (v != null) el.setAttribute('placeholder', v);
    });
    document.querySelectorAll('.lang button').forEach(function(b){
      b.setAttribute('aria-pressed', String(b.dataset.lang === l));
    });
    buildOptions();
    try { localStorage.setItem('zw_lang', l); } catch(e){}
  }
  document.querySelectorAll('.lang button').forEach(function(b){
    b.addEventListener('click', function(){ setLang(b.dataset.lang); });
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

  try { cur = localStorage.getItem('zw_lang') || 'en'; } catch(e){}
  setLang(cur);

})();
