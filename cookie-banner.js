'use strict';
/* ═══════════════════════════════════════════════════
   DSGVO Cookie Banner — Consent Mode v2
   Krause Immobilien | krauseimmo.com
   ═══════════════════════════════════════════════════ */
(function () {
  const STORAGE_KEY = 'krause_immo_consent';
  const EXPIRY_DAYS = 365;

  const banner  = document.getElementById('cb-banner');
  const overlay = document.getElementById('cb-overlay');
  const chkGtm  = document.getElementById('cb-gtm');
  const chkMktg = document.getElementById('cb-marketing');

  if (!banner || !overlay || !chkGtm || !chkMktg) return;

  /* Abhängigkeit: Marketing setzt GTM voraus */
  chkMktg.addEventListener('change', function () {
    if (this.checked) chkGtm.checked = true;
  });
  chkGtm.addEventListener('change', function () {
    if (!this.checked) chkMktg.checked = false;
  });

  /* Consent Mode v2 anwenden */
  function applyConsent(gtm, marketing) {
    if (typeof loadGTM === 'function') loadGTM();

    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'ad_storage':         marketing ? 'granted' : 'denied',
        'ad_user_data':       marketing ? 'granted' : 'denied',
        'ad_personalization': marketing ? 'granted' : 'denied',
        'analytics_storage':  marketing ? 'granted' : 'denied',
        'functionality_storage':   marketing ? 'granted' : 'denied',
        'personalization_storage': marketing ? 'granted' : 'denied',
        'security_storage':        'denied'
      });
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event':             'consent_update',
      'gtm_consent':       gtm       ? 'granted' : 'denied',
      'marketing_consent': marketing ? 'granted' : 'denied'
    });
  }

  /* Einwilligung speichern */
  function saveConsent(gtm, marketing) {
    const data = {
      gtm:       gtm,
      marketing: marketing,
      timestamp: new Date().toISOString(),
      version:   '2.0',
      expires:   Date.now() + EXPIRY_DAYS * 86400000
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    applyConsent(gtm, marketing);
    closeBanner();
  }

  /* Banner öffnen */
  function openBanner() {
    overlay.classList.add('cb-visible');
    banner.classList.add('cb-visible');
    requestAnimationFrame(function () {
      overlay.classList.add('cb-show');
      banner.classList.add('cb-show');
    });
    document.body.style.overflow = 'hidden';
  }

  /* Banner schließen */
  function closeBanner() {
    banner.classList.remove('cb-show');
    overlay.classList.remove('cb-show');
    setTimeout(function () {
      banner.classList.remove('cb-visible');
      overlay.classList.remove('cb-visible');
      document.body.style.overflow = '';
    }, 450);
  }

  /* Gespeicherte Einwilligung laden */
  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data.expires && Date.now() > data.expires) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) { return null; }
  }

  /* Button-Events */
  document.getElementById('cb-accept-all').addEventListener('click', function () {
    chkGtm.checked  = true;
    chkMktg.checked = true;
    saveConsent(true, true);
  });
  document.getElementById('cb-reject-all').addEventListener('click', function () {
    chkGtm.checked  = false;
    chkMktg.checked = false;
    saveConsent(false, false);
  });
  document.getElementById('cb-save').addEventListener('click', function () {
    var gtm      = chkGtm.checked;
    var marketing = chkMktg.checked && gtm;
    saveConsent(gtm, marketing);
  });

  /* Footer-Link: Banner erneut öffnen */
  var settingsLink = document.getElementById('cookie-settings');
  if (settingsLink) {
    settingsLink.addEventListener('click', function (e) {
      e.preventDefault();
      var saved = loadSaved();
      if (saved) {
        chkGtm.checked  = saved.gtm      || false;
        chkMktg.checked = saved.marketing || false;
      }
      openBanner();
    });
  }

  /* Init */
  var saved = loadSaved();
  if (saved) {
    applyConsent(saved.gtm || false, saved.marketing || false);
  } else {
    setTimeout(openBanner, 700);
  }

})();
