'use strict';

/* ── LENIS SMOOTH SCROLL ── */
let lenis;
function initLenis() {
  lenis = new Lenis({
    duration: 1.3,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothTouch: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ── CUSTOM CURSOR ── */
function initCursor() {
  const ring = document.getElementById('cursorRing');
  const dot  = document.getElementById('cursorDot');
  if (!ring || !dot) return;

  document.addEventListener('mousemove', e => {
    dot.style.left  = e.clientX + 'px';
    dot.style.top   = e.clientY + 'px';
    gsap.to(ring, { left: e.clientX, top: e.clientY, duration: 0.18, ease: 'power2.out' });
  });

  document.querySelectorAll('a, button, .mag-btn').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
}

/* ── NAVIGATION ── */
function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const mobile = document.getElementById('mobileNav');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 60);
  }, { passive: true });

  burger.addEventListener('click', () => mobile.classList.toggle('open'));
  mobile.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobile.classList.remove('open'));
  });
}

/* ── TEXT SPLITTING ── */
function splitChars(el) {
  const text = el.innerHTML
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '');
  el.innerHTML = '';
  // Wörter als Einheit umbrechen — kein Zeilenbruch mitten im Wort
  text.split(' ').forEach((word, i, arr) => {
    if (word.length > 0) {
      const wordWrap = document.createElement('span');
      wordWrap.style.cssText = 'display:inline; white-space:nowrap;';
      [...word].forEach(ch => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        wordWrap.appendChild(span);
      });
      el.appendChild(wordWrap);
    }
    if (i < arr.length - 1) {
      el.appendChild(document.createTextNode(' '));
    }
  });
  return el.querySelectorAll('.char');
}

/* ── SCROLL ANIMATIONS ── */
function initScrollAnims() {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.rf').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 88%',
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.85, delay: (i % 4) * 0.08, ease: 'power3.out' });
        el.classList.add('in');
      },
      once: true
    });
  });

  document.querySelectorAll('.ss').forEach(el => {
    const chars = splitChars(el);
    ScrollTrigger.create({
      trigger: el, start: 'top 85%',
      onEnter: () => {
        gsap.to(chars, { opacity: 1, y: 0, duration: 0.7, stagger: 0.015, ease: 'power4.out' });
      },
      once: true
    });
  });

  document.querySelectorAll('.stat').forEach(stat => {
    const numEl  = stat.querySelector('.sn');
    if (!numEl) return;
    const target = parseInt(stat.dataset.count);
    const suffix = stat.dataset.suffix || '';
    ScrollTrigger.create({
      trigger: stat, start: 'top 85%',
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target, duration: 2, ease: 'power2.out',
          onUpdate() { numEl.textContent = Math.floor(this.targets()[0].val) + suffix; }
        });
      },
      once: true
    });
  });
}

/* ── MAGNETIC BUTTONS ── */
function initMagnet() {
  if (window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.mag-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width  / 2;
      const y = e.clientY - r.top  - r.height / 2;
      gsap.to(btn, { x: x * 0.28, y: y * 0.28, duration: 0.4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.4)' });
    });
  });
}

/* ── PAGE ENTRY ANIMATION ── */
function initPageAnim() {
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to('.page-tag, .breadcrumb', { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
  tl.to('.page-hero-h1', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.3');
  tl.to('.page-hero-sub, .page-hero-content .btn-pri, .page-hero-content .btn-sec', {
    opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out'
  }, '-=0.5');
  tl.to('.page-hero-img', { opacity: 1, duration: 1, ease: 'power2.out' }, '-=0.8');
}

/* ── SUCHPROFIL TOGGLE (für immobilien.html) ── */
function initSuchprofilSubpage() {
  const toggle  = document.getElementById('spToggle');
  const form    = document.getElementById('spForm');
  const submit  = document.getElementById('spSubmit');
  const success = document.getElementById('spSuccess');
  if (!toggle || !form) return;

  toggle.addEventListener('click', () => {
    const isOpen = form.classList.toggle('open');
    const label  = toggle.querySelector('span');
    if (label) label.textContent = isOpen ? 'Suchprofil schließen' : 'Suchprofil anlegen';
    if (isOpen) setTimeout(() => form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    initMagnet();
  });

  if (submit) {
    submit.addEventListener('click', () => {
      const email = document.getElementById('spEmail');
      if (!email || !email.value.trim()) { if (email) email.focus(); return; }

      /* ── nForms Submission ── */
      const fd = new FormData();
      fd.append('name',         document.getElementById('spName')?.value   || '');
      fd.append('email',        email.value);
      fd.append('telefon',      document.getElementById('spPhone')?.value  || '');
      fd.append('objektart',    document.getElementById('spType')?.value   || '');
      fd.append('region',       document.getElementById('spRegion')?.value || '');
      fd.append('max_kaufpreis',document.getElementById('spPrice')?.value  || '');
      fd.append('min_zimmer',   document.getElementById('spRooms')?.value  || '');
      fd.append('min_flaeche',  document.getElementById('spSize')?.value   || '');
      fd.append('wuensche',     document.getElementById('spNotes')?.value  || '');
      fd.append('quelle',       'immobilien.html');

      fetch('https://api.nforms.eu/f/nf_z810ws5qsp2qiv28vutc8tpxk4gr9n5r', {
        method: 'POST', headers: { 'Accept': 'application/json' }, body: fd
      }).catch(err => console.error('nForms Suchprofil error:', err));

      if (success) {
        success.classList.add('show');
        gsap.from(success, { opacity: 0, y: 10, duration: 0.5, ease: 'power3.out' });
      }
      submit.style.display = 'none';
      setTimeout(() => { window.location.href = 'danke.html'; }, 800);
    });
  }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initNav();
  initCursor();
  initPageAnim();
  initScrollAnims();
  initMagnet();
  initSuchprofilSubpage();
});
