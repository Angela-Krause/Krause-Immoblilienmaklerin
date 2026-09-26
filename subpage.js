/* ============================================
   KRAUSE IMMOBILIEN – SUBPAGE JS
   ============================================ */

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

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('is-loaded');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  const hasScrollTrigger = typeof ScrollTrigger !== 'undefined';
  const hasLenis = typeof Lenis !== 'undefined';

  /* ---------- SCROLL ENTDSPERREN (kein Preloader auf Unterseiten) ---------- */
  document.body.classList.remove('no-scroll');

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

    mobileNav.querySelectorAll('a[data-close-nav], a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.classList.remove('no-scroll');
      });
    });
  }

  /* ---------- LENIS SMOOTH SCROLL ---------- */
  let lenis = null;
  if (hasLenis && !prefersReducedMotion) {
    lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- SMOOTH ANCHOR ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -80 });
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  /* ---------- REVEAL ANIMATIONEN ---------- */
  if (hasGsap && hasScrollTrigger && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.reveal-up').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        opacity: 0, y: 40, duration: 0.8, ease: 'power3.out'
      });
    });
  }

  /* ---------- STATS COUNTER ---------- */
  document.querySelectorAll('.stat-number').forEach(el => {
    const targetAttr = el.getAttribute('data-target');
    if (!targetAttr) return;
    const target = parseInt(targetAttr);
    const suffix = el.getAttribute('data-suffix') || '';
    if (hasGsap && hasScrollTrigger && !prefersReducedMotion) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.stats-bar', start: 'top 85%', toggleActions: 'play none none none' },
        onUpdate: () => { el.textContent = Math.floor(obj.val) + suffix; },
        onComplete: () => { el.textContent = target + suffix; }
      });
    } else {
      el.textContent = target + suffix;
    }
  });

  /* ---------- FOOTER JAHR ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- RATGEBER DOWNLOAD MODAL ---------- */
  const rgOverlay = document.getElementById('rgModalOverlay');
  const rgTitle = document.getElementById('rgModalTitle');
  const rgForm = document.getElementById('rgModalForm');
  const rgClose = document.getElementById('rgModalClose');
  const rgSuccess = document.getElementById('rgModalSuccess');

  if (rgOverlay) {
    function openRatgeber(title) {
      rgTitle.textContent = title;
      rgForm.style.display = '';
      rgSuccess.style.display = 'none';
      rgForm.reset();
      rgOverlay.classList.add('open');
      document.body.classList.add('no-scroll');
      const emailInput = document.getElementById('rgEmail');
      if (emailInput) setTimeout(() => emailInput.focus(), 50);
    }

    function closeRatgeber() {
      rgOverlay.classList.remove('open');
      document.body.classList.remove('no-scroll');
    }

    document.querySelectorAll('.ratgeber-card').forEach(card => {
      card.addEventListener('click', () => {
        openRatgeber(card.getAttribute('data-ratgeber') || 'Ratgeber');
      });
    });

    if (rgClose) rgClose.addEventListener('click', closeRatgeber);
    rgOverlay.addEventListener('click', (e) => {
      if (e.target === rgOverlay) closeRatgeber();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && rgOverlay.classList.contains('open')) closeRatgeber();
    });

    if (rgForm) {
      rgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('rgEmail');
        if (!email.checkValidity()) {
          rgForm.reportValidity();
          return;
        }
        sendForm(rgForm).then(() => {
          rgForm.style.display = 'none';
          rgSuccess.style.display = 'block';
        });
      });
    }
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

  /* ---------- BEWERTUNGS- UND SUCHPROFIL-FORMULARE ---------- */
  ['bewertungForm', 'suchprofilForm'].forEach((id) => {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wird vorbereitet …';
      }
      sendForm(form).then((ok) => {
        form.innerHTML = ok
          ? formSuccess('Anfrage gesendet!', FORM_SUCCESS_TEXT)
          : formSuccess('Fehler beim Senden', FORM_ERROR_TEXT);
      });
    });
  });
});