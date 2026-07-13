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

  const { vorname, nachname, email, telefon, immobilienart, adresse, nachricht, website } = body;

  // Honeypot: Bots füllen das versteckte Feld aus, Menschen nicht
  if (website) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  if (!vorname || !nachname || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name und E-Mail sind Pflichtfelder' }) };
  }

  try {
    {
      // 1. Benachrichtigung an Angela
      await brevoRequest(brevoKey, {
        sender: { name: 'KRAUSE Immobilien Website', email: 'info@krauseimmo.com' },
        to: [{ email: 'info@krauseimmo.com', name: 'Angela Krause' }],
        replyTo: { email: email, name: vorname + ' ' + nachname },
        subject: 'Neue Bewertungsanfrage – ' + vorname + ' ' + nachname,
        htmlContent:
          '<h2>Neue Immobilienbewertung angefragt</h2>' +
          '<table style="border-collapse:collapse;width:100%">' +
          '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Name</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + vorname + ' ' + nachname + '</td></tr>' +
          '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>E-Mail</strong></td><td style="padding:8px;border-bottom:1px solid #eee"><a href="mailto:' + email + '">' + email + '</a></td></tr>' +
          (telefon ? '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Telefon</strong></td><td style="padding:8px;border-bottom:1px solid #eee"><a href="tel:' + telefon + '">' + telefon + '</a></td></tr>' : '') +
          (immobilienart ? '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Immobilienart</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + immobilienart + '</td></tr>' : '') +
          (adresse ? '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Adresse</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + adresse + '</td></tr>' : '') +
          (nachricht ? '<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Nachricht</strong></td><td style="padding:8px;border-bottom:1px solid #eee">' + nachricht + '</td></tr>' : '') +
          '</table>' +
          '<p style="margin-top:1.5rem;color:#666">Diese Nachricht wurde automatisch von krauseimmo.com gesendet.</p>'
      });

      // 2. Bestätigung an Interessenten
      await brevoRequest(brevoKey, {
        sender: { name: 'KRAUSE Immobilien', email: 'info@krauseimmo.com' },
        to: [{ email: email, name: vorname + ' ' + nachname }],
        subject: 'Ihre Bewertungsanfrage – KRAUSE Immobilien',
        htmlContent:
          '<p>Sehr geehrte/r ' + vorname + ' ' + nachname + ',</p>' +
          '<p>vielen Dank für Ihre Anfrage zur Immobilienbewertung. Wir haben Ihre Daten erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.</p>' +
          '<p>Bei dringenden Fragen erreichen Sie uns unter <a href="tel:01608006113">0160 / 800 6113</a> oder <a href="mailto:info@krauseimmo.com">info@krauseimmo.com</a>.</p>' +
          '<p>Mit freundlichen Grüßen<br>Angela Krause<br>KRAUSE Immobilien UG (haftungsbeschränkt)</p>'
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Anfrage konnte nicht verarbeitet werden.', details: error.message })
    };
  }
};
