const https = require('https');

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

  try {
    // 1. Benachrichtigung an Angela
    await brevoRequest(brevoKey, {
      sender: { name: 'KRAUSE Immobilien Website', email: 'info@krauseimmo.com' },
      to: [{ email: 'info@krauseimmo.com', name: 'Angela Krause' }],
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

    // 2. Bestätigung an Absender
    await brevoRequest(brevoKey, {
      sender: { name: 'KRAUSE Immobilien', email: 'info@krauseimmo.com' },
      to: [{ email: email, name: name }],
      subject: 'Ihre Nachricht – KRAUSE Immobilien',
      htmlContent:
        '<p>Sehr geehrte/r ' + name + ',</p>' +
        '<p>vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und melden uns schnellstmöglich bei Ihnen.</p>' +
        '<p>Bei dringenden Fragen erreichen Sie uns unter <a href="tel:01608006113">0160 / 800 6113</a> oder <a href="mailto:info@krauseimmo.com">info@krauseimmo.com</a>.</p>' +
        '<p>Mit freundlichen Grüßen<br>Angela Krause<br>KRAUSE Immobilien UG (haftungsbeschränkt)</p>'
    });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Anfrage konnte nicht verarbeitet werden.', details: error.message })
    };
  }
};
