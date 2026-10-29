const crypto = require('crypto');
const https = require('https');

const API_URL = 'https://api.onoffice.de/api/stable/api.php';

const ipLog = {};
function isRateLimited(ip) {
  const now = Date.now();
  const window = 10 * 60 * 1000;
  if (!ipLog[ip]) ipLog[ip] = [];
  ipLog[ip] = ipLog[ip].filter(t => now - t < window);
  if (ipLog[ip].length >= 3) return true;
  ipLog[ip].push(now);
  return false;
}

function looksLikeGibberish(text) {
  if (!text) return false;
  return /[bcdfghjklmnpqrstvwxyz]{5,}/i.test(text);
}

function containsSpamPatterns(text) {
  if (!text) return false;
  return /\b(crypto|bitcoin|viagra|casino|lottery|prize|winner|click here|buy now|free money|SEO service)\b/i.test(text);
}

function spamCheck(fields, ip) {
  if (fields.website || fields.url2) return 'honeypot';
  if (!fields.formzeit || (Date.now() - parseInt(fields.formzeit)) < 8000) return 'zu-schnell';
  if (ip && isRateLimited(ip)) return 'rate-limit';
  const nameToCheck = ((fields.vorname || '') + ' ' + (fields.nachname || '')).trim();
  if (looksLikeGibberish(nameToCheck)) return 'gibberish-name';
  if (containsSpamPatterns(fields.nachricht || '')) return 'spam-keywords';
  const localPart = (fields.email || '').split('@')[0] || '';
  if (/(\.\w){4,}/.test(localPart)) return 'suspicious-email';
  return null;
}

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

  if (!vorname || !nachname || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name und E-Mail sind Pflichtfelder' }) };
  }

  const clientIp = (event.headers['x-forwarded-for'] || event.headers['client-ip'] || '').split(',')[0].trim();
  const spamReason = spamCheck({ vorname, nachname, email, nachricht, website, url2: body.url2, formzeit }, clientIp);
  if (spamReason) {
    console.error('[SPAM-BLOCK] Exposé-Anfrage blockiert:', spamReason, JSON.stringify({ vorname, nachname, email, ip: clientIp }));
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  const fullName = vorname + ' ' + nachname;
  const formData = { vorname, nachname, email, telefon, nachricht, objnr, formular: 'expose-anfrage', zeit: new Date().toISOString() };
  const brevoKey = process.env.BREVO_API_KEY;

  function brevoRequestInline(brevoApiKey, mailBody) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(mailBody);
      const req = https.request({
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoApiKey,
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

  try {
    // 1. Kontakt in onOffice anlegen
    let contactSuccess = null;
    try {
      const contactResult = await apiRequest(token, secret, 'urn:onoffice-de-ns:smart:2.5:smartml:action:create', 'address', {
        Vorname: vorname,
        Name: nachname,
        Email: email,
        Telefon1: telefon || '',
        Notiz: nachricht || '',
        Art: 'Interessent'
      });
      contactSuccess = contactResult?.response?.results?.[0]?.data?.records?.[0]?.id;
      if (!contactSuccess) {
        console.error('[FORMULAR-WARNUNG] Exposé-Anfrage – onOffice Kontakt konnte nicht angelegt werden:', JSON.stringify(contactResult));
      }
    } catch (onOfficeErr) {
      console.error('[FORMULAR-WARNUNG] Exposé-Anfrage – onOffice API Fehler:', onOfficeErr.message);
    }

    // 2. Immobilie suchen
    let estateId = null;
    if (objnr) {
      try {
        const estateResult = await apiRequest(token, secret, 'urn:onoffice-de-ns:smart:2.5:smartml:action:read', 'estate', {
          data: ['Id', 'objektnr_extern'],
          listlimit: 100
        });
        const allEstates = estateResult?.response?.results?.[0]?.data?.records || [];
        const match = allEstates.find(r => r.elements?.objektnr_extern === objnr);
        estateId = match?.id;
      } catch (estateErr) {
        console.error('[FORMULAR-WARNUNG] Exposé-Anfrage – Immobiliensuche fehlgeschlagen:', estateErr.message);
      }
    }

    // 3. Kontakt mit Immobilie verknüpfen
    if (estateId && contactSuccess) {
      try {
        await apiRequest(token, secret, 'urn:onoffice-de-ns:smart:2.5:smartml:action:create', 'relation', {
          relationtype: 'urn:onoffice-de-ns:smart:2.5:relationTypes:estate:address:interested',
          parentid: estateId,
          childid: contactSuccess
        });
      } catch (relErr) {
        console.error('[FORMULAR-WARNUNG] Exposé-Anfrage – Verknüpfung fehlgeschlagen:', relErr.message);
      }
    }

    // 4. Bestätigungs-E-Mail per Brevo senden
    if (brevoKey) {
      const confirmResult = await brevoRequestInline(brevoKey, {
        sender: { name: 'KRAUSE Immobilien', email: 'info@krauseimmo.com' },
        to: [{ email: email, name: fullName }],
        subject: 'Ihre Exposé-Anfrage – KRAUSE Immobilien',
        htmlContent: '<p>Sehr geehrte/r ' + fullName + ',</p>' +
          '<p>vielen Dank für Ihr Interesse an unserem Objekt <strong>' + (objnr || '') + '</strong>.</p>' +
          '<p>Ihre Anfrage ist bei uns eingegangen. Wir senden Ihnen das Exposé schnellstmöglich zu.</p>' +
          '<p>Bei Fragen erreichen Sie uns unter 0160 / 800 6113 oder info@krauseimmo.com.</p>' +
          '<p>Mit freundlichen Grüßen<br>Angela Krause<br>KRAUSE Immobilien UG (haftungsbeschränkt)</p>'
      });

      if (!confirmResult.messageId) {
        console.error('[FORMULAR-WARNUNG] Exposé-Anfrage – Bestätigungsmail fehlgeschlagen:', JSON.stringify(confirmResult));
      }

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
          const portalResult = await brevoRequestInline(brevoKey, {
            sender: { name: 'krauseimmo.com', email: 'info@krauseimmo.com' },
            to: [{ email: 'anfragen@immokrause.eu', name: 'Krause Immobilien' }],
            cc: [{ email: 'info@mb-topad.de', name: 'Marie Böttiger' }],
            replyTo: { email: email, name: fullName },
            subject: 'Objektanfrage ' + objnr + ' - krauseimmo.com',
            htmlContent: '<p>Objektanfrage über krauseimmo.com zu Objekt ' + objnr + '</p>' +
              '<p>' + fullName + ' (' + email + ')</p>',
            attachment: [{ content: xmlBase64, name: 'kontaktanfrage.xml' }]
          });

          if (!portalResult.messageId) {
            console.error('[FORMULAR-WARNUNG] Exposé-Anfrage – Portal-Mail fehlgeschlagen:', JSON.stringify(portalResult));
          }
        } catch (portalErr) {
          console.error('[FORMULAR-WARNUNG] Exposé-Anfrage – Portal-Mail Fehler:', portalErr.message);
        }
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
    console.error('[FORMULAR-FEHLER] Exposé-Anfrage – Unerwarteter Fehler:', error.message, JSON.stringify(formData));
    if (brevoKey) {
      try {
        await brevoRequestInline(brevoKey, {
          sender: { name: 'KRAUSE Website ALARM', email: 'info@krauseimmo.com' },
          to: [{ email: 'info@mb-topad.de', name: 'Marie Böttiger' }],
          subject: '⚠️ FORMULARFEHLER – Exposé-Anfrage von ' + (fullName || 'unbekannt'),
          htmlContent:
            '<h2 style="color:red">Formular-Fehler: Exposé-Anfrage</h2>' +
            '<p>Fehler: ' + error.message + '</p>' +
            '<p>Formulardaten:</p><pre>' + JSON.stringify(formData, null, 2) + '</pre>'
        });
      } catch (alertErr) {
        console.error('[FORMULAR-FEHLER] Auch Alert-Mail fehlgeschlagen:', alertErr.message);
      }
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Anfrage konnte nicht verarbeitet werden.' })
    };
  }
};
