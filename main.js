/* ============================================
   KRAUSE IMMOBILIEN – MAIN JS
   ============================================ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function markLoaded() {
  document.documentElement.classList.add('is-loaded');
}

function hidePreloader() {
  markLoaded();
  if (typeof window.__startHero === 'function') window.__startHero();
  const preloader = document.getElementById('preloader');
  if (!preloader || preloader.classList.contains('hidden')) return;
  preloader.classList.add('hidden');
  document.body.classList.remove('no-scroll');
}

/* Failsafe: nie weiße Seite, selbst wenn ein CDN (Gsap/Lenis) nicht lädt */
setTimeout(hidePreloader, 4000);
window.addEventListener('load', () => setTimeout(hidePreloader, 800));

/* ============================================
   FORMULAR-VERSAND (DSGVO)
   Kein Dienst Dritter: Die Angaben werden im E-Mail-Programm des Nutzers
   als Entwurf vorbereitet – übermittelt wird erst durch dessen Sendeklick.
   Endpunkte sind in FORM_ENDPOINTS pro Formular konfiguriert
   (POST, JSON mit benannten Feldern an Netlify Functions).
   ============================================ */
const FORM_ENDPOINTS = {
  contactForm: '/.netlify/functions/kontakt-anfrage',
  valuationForm: '/.netlify/functions/verkauf-anfrage',
  bewertungForm: '/.netlify/functions/verkauf-anfrage',
  exposeForm: '/.netlify/functions/expose-anfrage',
  suchprofilForm: '/.netlify/functions/kontakt-anfrage',
  rgModalForm: '/.netlify/functions/kontakt-anfrage'
};
const FORM_EMAIL = 'info@krauseimmo.com';

function formLabelFor(form, el) {
  if (el.id) {
    const label = form.querySelector('label[for="' + el.id + '"]');
    if (label) return label.textContent.replace(/\s*\*+\s*$/, '').trim();
  }
  if (el.name) return el.name;
  const holder = el.closest('.field');
  const groupLabel = holder && holder.querySelector('label');
  const suffix = el.placeholder ? el.placeholder.replace(/\s*\*+\s*$/, '').trim() : '';
  if (groupLabel) {
    const group = groupLabel.textContent.replace(/\s*\*+\s*$/, '').trim();
    return suffix ? group + ' (' + suffix + ')' : group;
  }
  return suffix || el.id || '';
}

function formDataRows(form) {
  const rows = [];
  Array.prototype.forEach.call(form.elements, (el) => {
    const type = (el.type || '').toLowerCase();
    if (el.disabled || type === 'submit' || type === 'button' || type === 'reset' || type === 'file') return;
    if (type === 'checkbox') {
      if (el.checked) rows.push([formLabelFor(form, el) || 'Zustimmung', 'ja']);
      return;
    }
    if (type === 'radio') {
      if (el.checked && el.value) rows.push([formLabelFor(form, el), el.value]);
      return;
    }
    const value = (el.value || '').trim();
    if (value) rows.push([formLabelFor(form, el), value]);
  });
  Array.prototype.forEach.call(form.querySelectorAll('[data-value].selected'), (el) => {
    let label = 'Auswahl';
    if (el.classList.contains('object-option')) {
      label = 'Objekttyp';
    } else {
      const holder = el.closest('.field');
      const groupLabel = holder && holder.querySelector('label');
      if (groupLabel) label = groupLabel.textContent.replace(/\s*\*+\s*$/, '').trim();
    }
    rows.push([label, el.getAttribute('data-value')]);
  });
  return rows;
}

function collectFormFields(form) {
  var data = {};
  var fd = new FormData(form);
  fd.forEach(function(val, key) { if (key !== 'dsgvo' && key !== 'website') data[key] = val; });
  form.querySelectorAll('[data-value].selected').forEach(function(el) {
    var key = el.closest('[data-step="1"]') ? 'immobilienart' : el.closest('[data-step="4"]') ? 'zustand' : 'auswahl';
    data[key] = el.getAttribute('data-value');
  });
  return data;
}

function buildPayload(formId, fields) {
  if (formId === 'contactForm') {
    return {
      name: ((fields.vorname || '') + ' ' + (fields.nachname || '')).trim(),
      phone: fields.telefon || '',
      email: fields.email || '',
      subject: fields.interesse || 'Kontaktanfrage',
      message: fields.nachricht || '',
      website: '',
      formzeit: Date.now().toString()
    };
  }
  if (formId === 'valuationForm' || formId === 'bewertungForm') {
    var adresse = [fields.strasse, fields.plz, fields.ort].filter(Boolean).join(', ');
    return {
      vorname: fields.vorname || fields.name || '',
      nachname: fields.nachname || '',
      email: fields.email || '',
      telefon: fields.telefon || '',
      immobilienart: fields.immobilienart || '',
      adresse: adresse || fields.adresse || '',
      nachricht: [fields.zustand, fields.notizen, fields.nachricht, fields.wohnflaeche ? 'Wohnfl.: ' + fields.wohnflaeche + ' m²' : '', fields.zimmer ? 'Zimmer: ' + fields.zimmer : '', fields.baujahr ? 'Baujahr: ' + fields.baujahr : '', fields.lage ? 'Lage: ' + fields.lage : ''].filter(Boolean).join(' | '),
      website: '',
      formzeit: Date.now().toString()
    };
  }
  if (formId === 'exposeForm') {
    var params = new URLSearchParams(window.location.search);
    return {
      vorname: fields.vorname || '',
      nachname: fields.nachname || '',
      email: fields.email || '',
      telefon: fields.telefon || '',
      nachricht: fields.nachricht || '',
      objnr: params.get('objnr') || fields.objnr || '',
      website: '',
      formzeit: Date.now().toString()
    };
  }
  fields.website = '';
  fields.formzeit = Date.now().toString();
  return fields;
}

function sendForm(form) {
  var endpoint = FORM_ENDPOINTS[form.id];
  if (endpoint) {
    var fields = collectFormFields(form);
    var payload = buildPayload(form.id, fields);
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return true;
    }).catch(function() { return false; });
  }
  var rows = formDataRows(form);
  var body = rows.map(function(row) { return row[0] + ': ' + row[1]; }).join('\r\n');
  var subject = 'Anfrage über die Website';
  window.location.href = 'mailto:' + FORM_EMAIL +
    '?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body);
  return Promise.resolve(true);
}

function formSuccess(title, text) {
  return '<div class="valuation-success">' +
    '<i class="fas fa-paper-plane"></i>' +
    '<h3>' + title + '</h3>' +
    '<p>' + text + '</p>' +
    '</div>';
}

const FORM_SUCCESS_TEXT = 'Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet. Wir melden uns innerhalb von 24 Stunden bei Ihnen. Bei dringenden Anliegen erreichen Sie uns unter <a href="tel:+491608006113">0160 / 800 6113</a>.';
const FORM_ERROR_TEXT = 'Beim Senden ist leider ein Fehler aufgetreten. Bitte schreiben Sie uns direkt an <a href="mailto:info@krauseimmo.com">info@krauseimmo.com</a> oder rufen Sie <a href="tel:+491608006113">0160 / 800 6113</a> an.';

/* ============================================
   IMMOBILIEN AUS ONOFFICE LADEN
   ============================================ */
let _propsCache = null;

async function loadPropertiesAsync() {
  if (_propsCache !== null) return _propsCache;
  try {
    var resp = await fetch('/.netlify/functions/get-properties');
    if (resp.ok) {
      var data = await resp.json();
      var items = Array.isArray(data) ? data : (data.items || []);
      if (items.length > 0) { _propsCache = items.sort(function(a, b) { return b.id - a.id; }); return _propsCache; }
    }
  } catch (e) {}
  _propsCache = [];
  return _propsCache;
}

async function renderProperties() {
  var grid = document.getElementById('propGrid');
  var empty = document.getElementById('propEmpty');
  var countEl = document.getElementById('propCount');
  if (!grid) return;

  var props = await loadPropertiesAsync();

  grid.innerHTML = '';
  if (props.length === 0) {
    if (empty) empty.style.display = 'block';
    if (countEl) countEl.textContent = '';
    return;
  }
  if (empty) empty.style.display = 'none';
  if (countEl) countEl.textContent = props.length + ' Immobilie' + (props.length !== 1 ? 'n' : '');

  props.forEach(function(p) {
    var statusClass = p.status === 'Verfügbar' ? 'available' : p.status === 'Reserviert' ? 'reserved' : 'sold';
    var img = p.image || 'Bild-Haus.webp';
    var priceText = p.price ? p.price + ' €' : 'Preis auf Anfrage';
    var sizeText = p.size ? 'ca. ' + p.size + ' m²' : '';
    var secretBadge = p.secret_sale ? '<span class="property-status secret">Secret Sale</span>' : '';

    var card = document.createElement('article');
    card.className = 'property-card reveal-up';
    card.innerHTML =
      '<a href="expose.html?objnr=' + encodeURIComponent(p.objnr) + '&titel=' + encodeURIComponent(p.title) + '">' +
        '<span class="property-status ' + statusClass + '">' + p.status + '</span>' +
        secretBadge +
        '<img src="' + img + '" alt="' + (p.title || '') + '" loading="lazy">' +
        '<div class="property-card-overlay">' +
          '<h3>' + (p.title || '') + '</h3>' +
          '<div class="property-card-meta">' +
            '<span><i class="fas fa-tag"></i> ' + priceText + '</span>' +
            (sizeText ? '<span><i class="fas fa-expand"></i> ' + sizeText + '</span>' : '') +
            (p.rooms ? '<span><i class="fas fa-door-open"></i> ' + p.rooms + ' Zi.</span>' : '') +
          '</div>' +
        '</div>' +
      '</a>';
    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- HERO-STARTE (sobald der Preloader verschwindet) ---------- */
  window.__startHero = function () {
    if (window.__heroStarted) return;
    window.__heroStarted = true;
    if (prefersReducedMotion) return;
    initParticles();
    initHeroAnimations();
  };

  /* ---------- PRELOADER (elegante KI Logo-Aufbau Animation) ---------- */
  const preloader = document.getElementById('preloader');
  const preloaderFill = document.getElementById('preloaderFill');
  const prRect = document.getElementById('prRect');
  const prK = document.getElementById('prK');
  const prI = document.getElementById('prI');

  if (preloader && prRect && window.gsap && !prefersReducedMotion) {
    const prTl = gsap.timeline({
      onComplete: () => {
        markLoaded();
        gsap.to(preloader, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: hidePreloader
        });
      }
    });

    prTl.to(prRect, { opacity: 1, duration: 0.4, ease: 'power2.out' })
        .to(prK, { opacity: 1, y: 0, duration: 0.32, ease: 'back.out(1.7)' }, '-=0.1')
        .to(prI, { opacity: 1, y: 0, duration: 0.32, ease: 'back.out(1.7)' }, '-=0.18')
        .to(preloaderFill, { width: '100%', duration: 0.55, ease: 'power2.inOut' }, '-=0.25')
        .to({}, { duration: 0.15 });
  } else {
    hidePreloader();
  }

  /* ---------- PARTICLE SYSTEM (dezente grüne Punkte + Linien) ---------- */
  function initParticles() {
    const canvas = document.getElementById('heroParticles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [], mouse = { x: -1000, y: -1000 };

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    const count = Math.min(60, Math.floor(window.innerWidth / 25));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1,
        opacity: Math.random() * 0.15 + 0.05
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(42, 95, 141, ${p.opacity})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(42, 95, 141, ${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(201, 162, 39, ${0.08 * (1 - mDist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------- LENIS SMOOTH SCROLL ---------- */
  let lenis = null;

  if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.5,
      wheelMultiplier: 1,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.gsap) {
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------- NAVIGATION SCROLL ---------- */
  const nav = document.getElementById('nav');
  const topbar = document.querySelector('.topbar');

  function checkNavScroll() {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    if (topbar) {
      const span = Math.max(300, window.innerHeight * 0.45);
      const solid = Math.min(1, Math.max(0, window.scrollY / span));
      topbar.style.setProperty('--tb-solid', solid.toFixed(3));
    }
  }

  window.addEventListener('scroll', checkNavScroll, { passive: true });
  checkNavScroll();

  /* ---------- BURGER MENU ---------- */
  const burger = document.getElementById('navBurger');
  const mobileNav = document.getElementById('navMobile');

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isOpen = burger.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.classList.toggle('no-scroll', isOpen);
    });

    mobileNav.querySelectorAll('a[data-close-nav]').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.classList.remove('no-scroll');
      });
    });
  }

  /* ---------- SMOOTH ANCHOR SCROLL ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -80 });
        } else {
          const y = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    });
  });

  /* ---------- CUSTOM CURSOR (eleganter grüner Punkt mit Lag) ---------- */
  const cursor = document.getElementById('cursor');
  const isTouchDevice = window.matchMedia('(hover: none)').matches ||
                        'ontouchstart' in window ||
                        navigator.maxTouchPoints > 0;

  if (cursor && window.innerWidth > 768 && !isTouchDevice) {
    let mouseX = -100, mouseY = -100;
    let cursorX = -100, cursorY = -100;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function updateCursor() {
      const ease = 0.12;
      cursorX += (mouseX - cursorX) * ease;
      cursorY += (mouseY - cursorY) * ease;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      requestAnimationFrame(updateCursor);
    }
    updateCursor();

    document.querySelectorAll('a, button, .btn, input, select, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
  } else if (cursor) {
    cursor.style.display = 'none';
  }

  /* ---------- MAGNETIC BUTTONS ---------- */
  if (window.innerWidth > 768 && !isTouchDevice) {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        if (window.gsap) {
          gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'elastic.out(1, 0.4)',
            clearProps: 'transform'
          });
        }
      });
    });
  }

  /* ---------- HERO ANIMATIONS ---------- */
  function initHeroAnimations() {
    if (typeof gsap === 'undefined') return;

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(); }
    });

    tl.from('.hero-headline', {
      opacity: 0,
      y: 40,
      duration: 0.8
    })
    .from('.hero-cities', {
      opacity: 0,
      y: 30,
      duration: 0.6
    }, '-=0.4')
    .from('.hero-buttons .btn', {
      opacity: 0,
      y: 25,
      duration: 0.5,
      stagger: 0.12
    }, '-=0.3')
    .from('.hero-angela img', {
      opacity: 0,
      x: 60,
      duration: 1,
      ease: 'power2.out'
    }, '-=0.8');
  }

  /* ---------- STATS COUNTER (GSAP ScrollTrigger) ---------- */
  function initStatsCounter() {
    if (typeof gsap === 'undefined') {
      document.querySelectorAll('.stat-number').forEach(el => {
        const target = parseInt(el.getAttribute('data-target'));
        const suffix = el.getAttribute('data-suffix') || '';
        el.textContent = target + suffix;
      });
      return;
    }

    const statsBar = document.querySelector('.stats-bar');
    if (!statsBar) return;

    gsap.from('.stat-item', {
      scrollTrigger: {
        trigger: statsBar,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.15,
      ease: 'power3.out'
    });

    document.querySelectorAll('.stat-number').forEach(el => {
      const target = parseInt(el.getAttribute('data-target'));
      const suffix = el.getAttribute('data-suffix') || '';
      const obj = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: statsBar,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        onUpdate: () => {
          el.textContent = Math.floor(obj.val) + suffix;
        },
        onComplete: () => {
          el.textContent = target + suffix;
        }
      });
    });
  }

  /* ---------- SCROLL REVEAL ---------- */
  const hasGsap = typeof gsap !== 'undefined';
  const hasScrollTrigger = typeof ScrollTrigger !== 'undefined';
  if (hasGsap && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  function initScrollReveal() {
    if (!(hasGsap && hasScrollTrigger)) return;

    gsap.utils.toArray('.reveal-up').forEach(el => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
      });
    });

    gsap.utils.toArray('.reveal-left').forEach(el => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        x: -40,
        duration: 0.8,
        ease: 'power3.out',
      });
    });

    gsap.utils.toArray('.reveal-right').forEach(el => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        x: 40,
        duration: 0.8,
        ease: 'power3.out',
      });
    });

    gsap.utils.toArray('.stagger-children').forEach(parent => {
      const children = parent.children;
      gsap.from(children, {
        scrollTrigger: {
          trigger: parent,
          start: 'top 90%',
          toggleActions: 'play none none none',
          once: true
        },
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out',
        clearProps: 'opacity,transform'
      });
    });
  }

  initScrollReveal();

  /* ---------- PARALLAX (Hero + Leistungen) ---------- */
  function initParallax() {
    if (!(hasGsap && hasScrollTrigger) || prefersReducedMotion) return;

    // Hero: Hintergrundbild & Angela-Foto bewegen sich langsamer
    gsap.to('.hero-dark-img', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    gsap.to('.hero-angela img', {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }
  initStatsCounter();
  initParallax();

  /* ---------- FOOTER JAHR ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- WERTERMITTLUNG: mehrstufiges Formular ---------- */
  const valuationForm = document.getElementById('valuationForm');
  if (valuationForm) {
    const steps = valuationForm.querySelectorAll('.valuation-step');
    const prevBtn = document.getElementById('valuationPrev');
    const nextBtn = document.getElementById('valuationNext');
    const progressFill = document.getElementById('progressFill');
    const stepLabel = document.getElementById('stepLabel');
    const stepCurrent = document.getElementById('stepCurrent');

    const stepNames = ['Objekttyp', 'Eckdaten', 'Lage', 'Zustand', 'Kontakt'];
    const selectedData = {
      objekttyp: null,
      zustand: null
    };

    let currentStep = 1;
    const totalSteps = steps.length;

    function updateStep() {
      steps.forEach(step => {
        step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
      });
      progressFill.style.width = (currentStep / totalSteps) * 100 + '%';
      stepLabel.textContent = stepNames[currentStep - 1];
      stepCurrent.textContent = currentStep;

      prevBtn.disabled = currentStep === 1;
      if (currentStep === totalSteps) {
        nextBtn.innerHTML = 'Anfrage senden <i class="fas fa-paper-plane"></i>';
      } else {
        nextBtn.innerHTML = 'Weiter <i class="fas fa-arrow-right"></i>';
      }
    }

    // Objekttyp auswählen
    valuationForm.querySelectorAll('.object-option').forEach(opt => {
      opt.addEventListener('click', () => {
        valuationForm.querySelectorAll('.object-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedData.objekttyp = opt.dataset.value;
      });
    });

    // Zustand auswählen
    valuationForm.querySelectorAll('.state-option').forEach(opt => {
      opt.addEventListener('click', () => {
        valuationForm.querySelectorAll('.state-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedData.zustand = opt.dataset.value;
      });
    });

    function stepValid(stepIndex) {
      if (stepIndex < totalSteps) return true;
      const name = valuationForm.querySelector('#objName');
      const email = valuationForm.querySelector('#objEmail');
      return name.value.trim() !== '' &&
             email.value.trim() !== '' &&
             email.checkValidity();
    }

    nextBtn.addEventListener('click', () => {
      if (currentStep < totalSteps) {
        currentStep++;
        updateStep();
      } else {
        if (!stepValid(currentStep)) {
          if (!valuationForm.querySelector('#objName').value.trim()) valuationForm.querySelector('#objName').focus();
          else valuationForm.querySelector('#objEmail').focus();
          return;
        }
        // Angaben vorbereiten: E-Mail-Programm öffnen (Versand nur durch den Nutzer)
        nextBtn.disabled = true;
        nextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wird vorbereitet …';
        sendForm(valuationForm).then((ok) => {
          valuationForm.innerHTML = ok
            ? formSuccess('Anfrage gesendet!', FORM_SUCCESS_TEXT)
            : formSuccess('Fehler beim Senden', FORM_ERROR_TEXT);
        });
      }
    });

    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateStep();
      }
    });

    updateStep();
  }

  /* ---------- KONTAKTFORMULAR ---------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      const submitBtn = contactForm.querySelector('.contact-submit');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wird vorbereitet …';
      sendForm(contactForm).then((ok) => {
        contactForm.innerHTML = ok
          ? formSuccess('Anfrage gesendet!', FORM_SUCCESS_TEXT)
          : formSuccess('Fehler beim Senden', FORM_ERROR_TEXT);
      });
    });
  }

  /* ---------- IMMOBILIEN LADEN ---------- */
  renderProperties();

  /* ---------- SCROLL REVEAL für neue Sektionen ---------- */
  if (hasGsap && hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
});
