const crypto = require('crypto');
const https = require('https');

const API_URL = 'https://api.onoffice.de/api/stable/api.php';

function createHmac(token, secret, timestamp, resourceType, actionId) {
  const fields = [timestamp, token, resourceType, actionId];
  const hmacData = fields.join('');
  return crypto.createHmac('sha256', secret).update(hmacData).digest('base64');
}

function apiRequest(token, secret, actionId, resourceType, parameters) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hmac = createHmac(token, secret, timestamp, resourceType, actionId);

  const payload = {
    token,
    request: {
      actions: [{
        actionid: actionId,
        resourceid: '',
        resourcetype: resourceType,
        identifier: '',
        timestamp,
        hmac,
        hmac_version: '2',
        parameters
      }]
    }
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Invalid JSON: ' + body.substring(0, 200))); }
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

  const token = process.env.ONOFFICE_API_TOKEN;
  const secret = process.env.ONOFFICE_API_SECRET;

  if (!token || !secret) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  const { vorname, nachname, email, telefon, nachricht, objnr, website, formzeit } = body;

  // Honeypot
  if (website) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  // Zeitstempel-Check: unter 3 Sekunden = Bot
  if (!formzeit || (Date.now() - parseInt(formzeit)) < 3000) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  if (!vorname || !nachname || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name und E-Mail sind Pflichtfelder' }) };
  }

  try {
    // 1. Kontakt in onOffice anlegen
    const contactResult = await apiRequest(token, secret, 'urn:onoffice-de-ns:smart:2.5:smartml:action:create', 'address', {
      Vorname: vorname,
      Name: nachname,
      Email: email,
      Telefon1: telefon || '',
      Notiz: nachricht || '',
      Art: 'Interessent'
    });

    const contactSuccess = contactResult?.response?.results?.[0]?.data?.records?.[0]?.id;
    let mailResult = null;

    // 2. Immobilie suchen
    let estateId = null;
    if (objnr) {
      const estateResult = await apiRequest(token, secret, 'urn:onoffice-de-ns:smart:2.5:smartml:action:read', 'estate', {
        data: ['Id', 'objektnr_extern'],
        listlimit: 100
      });
      const allEstates = estateResult?.response?.results?.[0]?.data?.records || [];
      const match = allEstates.find(r => r.elements?.objektnr_extern === objnr);
      estateId = match?.id;
    }

    // 3. Kontakt mit Immobilie verknüpfen
    if (estateId && contactSuccess) {
      try {
        await apiRequest(token, secret, 'urn:onoffice-de-ns:smart:2.5:smartml:action:create', 'relation', {
          relationtype: 'urn:onoffice-de-ns:smart:2.5:relationTypes:estate:address:interested',
          parentid: estateId,
          childid: contactSuccess
        });
      } catch (relErr) {}
    }

    // 4. Bestätigungs-E-Mail per Brevo senden
    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
      try {
        const mailBody = JSON.stringify({
          sender: { name: 'KRAUSE Immobilien', email: 'info@krauseimmo.com' },
          to: [{ email: email, name: vorname + ' ' + nachname }],
          subject: 'Ihre Exposé-Anfrage – KRAUSE Immobilien',
          htmlContent: '<p>Sehr geehrte/r ' + vorname + ' ' + nachname + ',</p>' +
            '<p>vielen Dank für Ihr Interesse an unserem Objekt <strong>' + (objnr || '') + '</strong>.</p>' +
            '<p>Ihre Anfrage ist bei uns eingegangen. Wir senden Ihnen das Exposé schnellstmöglich zu.</p>' +
            '<p>Bei Fragen erreichen Sie uns unter 0160 / 800 6113 oder info@krauseimmo.com.</p>' +
            '<p>Mit freundlichen Grüßen<br>Angela Krause<br>KRAUSE Immobilien UG (haftungsbeschränkt)</p>'
        });
        const brevoUrl = new URL('https://api.brevo.com/v3/smtp/email');
        mailResult = await new Promise((resolve, reject) => {
          const req = https.request({
            hostname: brevoUrl.hostname,
            path: brevoUrl.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': brevoKey,
              'Content-Length': Buffer.byteLength(mailBody)
            }
          }, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
              try { resolve(JSON.parse(body)); }
              catch (e) { resolve({ status: res.statusCode, body }); }
            });
          });
          req.on('error', reject);
          req.write(mailBody);
          req.end();
        });
      } catch (mailErr) { mailResult = { error: mailErr.message }; }

      // 5. Anfrage-Mail mit OpenImmo XML an onOffice senden (triggert Portalfilter)
      if (objnr) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const anrede = body.anrede || '';
          const xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<openimmo_feedback>\n' +
            '  <version>1.2.7</version>\n' +
            '  <sender>\n' +
            '    <name>krauseimmo.com</name>\n' +
            '    <datum>' + today + '</datum>\n' +
            '  </sender>\n' +
            '  <objekt>\n' +
            '    <oobj_id>' + objnr + '</oobj_id>\n' +
            '    <vermarktungsart>KAUF</vermarktungsart>\n' +
            '    <interessent>\n' +
            (anrede ? '      <anrede>' + anrede + '</anrede>\n' : '') +
            '      <vorname>' + vorname + '</vorname>\n' +
            '      <nachname>' + nachname + '</nachname>\n' +
            '      <email>' + email + '</email>\n' +
            '      <tel>' + (telefon || '') + '</tel>\n' +
            '      <bevorzugt>EMAIL</bevorzugt>\n' +
            '      <wunsch>DETAIL</wunsch>\n' +
            '      <anfrage>' + (nachricht || 'Exposé-Anfrage über krauseimmo.com') + '</anfrage>\n' +
            '    </interessent>\n' +
            '  </objekt>\n' +
            '</openimmo_feedback>';

          const xmlBase64 = Buffer.from(xmlContent).toString('base64');
          const portalMailBody = JSON.stringify({
            sender: { name: 'krauseimmo.com', email: 'info@krauseimmo.com' },
            to: [{ email: 'anfragen@immokrause.eu', name: 'Krause Immobilien' }],
            replyTo: { email: email, name: vorname + ' ' + nachname },
            subject: 'Objektanfrage ' + objnr + ' - krauseimmo.com',
            htmlContent: '<p>Objektanfrage über krauseimmo.com zu Objekt ' + objnr + '</p>' +
              '<p>' + vorname + ' ' + nachname + ' (' + email + ')</p>',
            attachment: [{ content: xmlBase64, name: 'kontaktanfrage.xml' }]
          });
          const brevoUrl2 = new URL('https://api.brevo.com/v3/smtp/email');
          await new Promise((resolve, reject) => {
            const req = https.request({
              hostname: brevoUrl2.hostname,
              path: brevoUrl2.pathname,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'api-key': brevoKey,
                'Content-Length': Buffer.byteLength(portalMailBody)
              }
            }, (res) => {
              let b = '';
              res.on('data', chunk => { b += chunk; });
              res.on('end', () => resolve(b));
            });
            req.on('error', reject);
            req.write(portalMailBody);
            req.end();
          });
        } catch (e) {}
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns in Kürze bei Ihnen.'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Anfrage konnte nicht verarbeitet werden.', details: error.message })
    };
  }
};
