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

  const token = process.env.ONOFFICE_API_TOKEN;
  const secret = process.env.ONOFFICE_API_SECRET;

  // Debug: Vorlagen abfragen
  if (event.queryStringParameters && event.queryStringParameters.debug === 'templates') {
    const templates = await apiRequest(token, secret,
      'urn:onoffice-de-ns:smart:2.5:smartml:action:get',
      'templates',
      { type: 'pdf' }
    );
    const emailTemplates = await apiRequest(token, secret,
      'urn:onoffice-de-ns:smart:2.5:smartml:action:get',
      'templates',
      { type: 'email' }
    );
    return { statusCode: 200, headers, body: JSON.stringify({ pdf: templates, email: emailTemplates }, null, 2) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!token || !secret) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  const { vorname, nachname, email, telefon, nachricht, objnr } = body;

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

    // 2. Wenn Objekt-Nr. vorhanden: Anfrage mit Objekt verknüpfen
    if (objnr && contactSuccess) {
      // Immobilie suchen
      const estateResult = await apiRequest(token, secret, 'urn:onoffice-de-ns:smart:2.5:smartml:action:read', 'estate', {
        filter: {
          objektnr_extern: [{ op: '=', val: objnr }]
        },
        data: ['Id'],
        listlimit: 1
      });

      const estateId = estateResult?.response?.results?.[0]?.data?.records?.[0]?.id;

      if (estateId) {
        // Verknüpfung herstellen (Interessent → Immobilie)
        await apiRequest(token, secret, 'urn:onoffice-de-ns:smart:2.5:smartml:action:create', 'relation', {
          relationtype: 'urn:onoffice-de-ns:smart:2.5:relationTypes:estate:address:interested',
          parentid: estateId,
          childid: contactSuccess
        });

        // 3. Exposé per E-Mail senden
        try {
          mailResult = await apiRequest(token, secret, 'urn:onoffice-de-ns:smart:2.5:smartml:action:do', 'sendmail', {
            emailidentity: 'info@krauseimmo.com',
            subject: 'Ihr angefordertes Exposé – KRAUSE Immobilien',
            body: `Sehr geehrte/r ${vorname} ${nachname},\n\nvielen Dank für Ihr Interesse! Anbei erhalten Sie das gewünschte Exposé.\n\nBei Fragen stehe ich Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\nAngela Krause\nKRAUSE Immobilien UG`,
            pdfexposeidentifiers: ['urn:onoffice-de-ns:smart:2.5:pdf:expose:lang:Exposé Alba'],
            estateids: [estateId],
            receiver: [email]
          });
        } catch (mailErr) { mailResult = { error: mailErr.message }; }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Ihre Anfrage wurde erfolgreich übermittelt. Sie erhalten in Kürze eine Bestätigung per E-Mail.',
        mailDebug: mailResult || 'no estate linked'
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
