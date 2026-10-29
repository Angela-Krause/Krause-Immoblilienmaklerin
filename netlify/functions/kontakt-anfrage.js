const https = require('https');

function verifyRecaptcha(token, secret) {
  if (!token || !secret) return Promise.resolve({ success: true, score: 1 });
  const postData = 'secret=' + encodeURIComponent(secret) + '&response=' + encodeURIComponent(token);
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'www.google.com',
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve({ success: true, score: 1 }); }
      });
    });
    req.on('error', () => resolve({ success: true, score: 1 }));
    req.write(postData);
    req.end();
  });
}

function brevoRequest(brevoKey, mailBody) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(mailBody);
    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoKey,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve({ status: res.statusCode }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  const { name, phone, email, subject, message, website, formzeit } = body;

  // Honeypot
  if (website) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  // Zeitstempel-Check: unter 3 Sekunden = Bot
  if (!formzeit || (Date.now() - parseInt(formzeit)) < 3000) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  if (!name || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name und E-Mail sind Pflichtfelder' }) };
  }

  // reCAPTCHA v3 Prüfung
  const recaptchaSecret = process.env.RECAPTCHA_SECRET;
  if (body.recaptchaToken && recaptchaSecret) {
    const captchaResult = await verifyRecaptcha(body.recaptchaToken, recaptchaSecret);
    if (captchaResult.success && captchaResult.score < 0.5) {
      console.error('[SPAM-BLOCK] Kontaktanfrage – reCAPTCHA Score zu niedrig:', captchaResult.score, JSON.stringify({ name, email }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }
  }

  const formData = { name, phone, email, subject, message, formular: 'kontakt-anfrage', zeit: new Date().toISOString() };

  try {
    // 1. Benachrichtigung an Angela
    const notifyResult = await brevoRequest(brevoKey, {
      sender: { name: 'KRAUSE Immobilien Website', email: 'info@krauseimmo.com' },
      to: [{ email: 'info@krauseimmo.com', name: 'Angela Krause' }, { email: 'info@mb-topad.de', name: 'Marie Böttiger' }],
      replyTo: { email: email, name: name },
      subject: 'Neue Kontaktanfrage – ' + name,
      htmlContent:
        '<h2>Neue Kontaktanfrage</h2>' +
        '<table style="border-collapse:collapse;width:100%">' +
        '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Name</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + name + '</td></tr>' +
        '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>E-Mail</strong></td><td style="padding:8px;border-bottom:1px solid #eee"><a href="mailto:' + email + '">' + email + '</a></td></tr>' +
        (phone ? '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Telefon</strong></td><td style="padding:8px;border-bottom:1px solid #eee"><a href="tel:' + phone + '">' + phone + '</a></td></tr>' : '') +
        (subject ? '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Anliegen</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + subject + '</td></tr>' : '') +
        (message ? '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Nachricht</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + message + '</td></tr>' : '') +
        '</table>' +
        '<p style="margin-top:1.5rem;color:#666">Diese Nachricht wurde automatisch von krauseimmo.com gesendet.</p>'
    });

    if (!notifyResult.messageId) {
      console.error('[FORMULAR-FEHLER] Kontaktanfrage – Brevo-Benachrichtigung fehlgeschlagen:', JSON.stringify({ brevoResponse: notifyResult, formData }));
      // Fehler-Alert an Marie
      try {
        await brevoRequest(brevoKey, {
          sender: { name: 'KRAUSE Website ALARM', email: 'info@krauseimmo.com' },
          to: [{ email: 'info@mb-topad.de', name: 'Marie Böttiger' }],
          subject: '⚠️ FORMULARFEHLER – Kontaktanfrage von ' + name,
          htmlContent:
            '<h2 style="color:red">Formular-Fehler: Kontaktanfrage</h2>' +
            '<p>Die Benachrichtigungs-Mail konnte nicht zugestellt werden. Bitte kontaktiere den Interessenten manuell:</p>' +
            '<table style="border-collapse:collapse;width:100%">' +
            '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Name</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + name + '</td></tr>' +
            '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>E-Mail</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + email + '</td></tr>' +
            (phone ? '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Telefon</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + phone + '</td></tr>' : '') +
            (subject ? '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Anliegen</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + subject + '</td></tr>' : '') +
            (message ? '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Nachricht</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + message + '</td></tr>' : '') +
            '</table>' +
            '<p style="color:#666">Brevo-Antwort: ' + JSON.stringify(notifyResult) + '</p>'
        });
      } catch (alertErr) {
        console.error('[FORMULAR-FEHLER] Auch Alert-Mail fehlgeschlagen:', alertErr.message);
      }
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'E-Mail konnte nicht gesendet werden.' }) };
    }

    // 2. Bestätigung an Absender
    const confirmResult = await brevoRequest(brevoKey, {
      sender: { name: 'KRAUSE Immobilien', email: 'info@krauseimmo.com' },
      to: [{ email: email, name: name }],
      subject: 'Ihre Nachricht – KRAUSE Immobilien',
      htmlContent:
        '<p>Sehr geehrte/r ' + name + ',</p>' +
        '<p>vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und melden uns schnellstmöglich bei Ihnen.</p>' +
        '<p>Bei dringenden Fragen erreichen Sie uns unter <a href="tel:01608006113">0160 / 800 6113</a> oder <a href="mailto:info@krauseimmo.com">info@krauseimmo.com</a>.</p>' +
        '<p>Mit freundlichen Grüßen<br>Angela Krause<br>KRAUSE Immobilien UG (haftungsbeschränkt)</p>'
    });

    if (!confirmResult.messageId) {
      console.error('[FORMULAR-WARNUNG] Bestätigungsmail an Absender fehlgeschlagen:', JSON.stringify({ brevoResponse: confirmResult, email }));
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch (error) {
    console.error('[FORMULAR-FEHLER] Kontaktanfrage – Unerwarteter Fehler:', error.message, JSON.stringify(formData));
    // Fehler-Alert an Marie
    try {
      await brevoRequest(brevoKey, {
        sender: { name: 'KRAUSE Website ALARM', email: 'info@krauseimmo.com' },
        to: [{ email: 'info@mb-topad.de', name: 'Marie Böttiger' }],
        subject: '⚠️ FORMULARFEHLER – Kontaktanfrage von ' + (name || 'unbekannt'),
        htmlContent:
          '<h2 style="color:red">Formular-Fehler: Kontaktanfrage</h2>' +
          '<p>Fehler: ' + error.message + '</p>' +
          '<p>Formulardaten:</p><pre>' + JSON.stringify(formData, null, 2) + '</pre>'
      });
    } catch (alertErr) {
      console.error('[FORMULAR-FEHLER] Auch Alert-Mail fehlgeschlagen:', alertErr.message);
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Anfrage konnte nicht verarbeitet werden.' })
    };
  }
};
