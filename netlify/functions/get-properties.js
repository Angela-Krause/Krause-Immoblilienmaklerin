const crypto = require('crypto');
const https = require('https');

const API_URL = 'https://api.onoffice.de/api/stable/api.php';

function createHmac(token, secret, timestamp, resourceType, actionId) {
  const fields = [timestamp, token, resourceType, actionId];
  return crypto.createHmac('sha256', secret).update(fields.join('')).digest('base64');
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
        catch (e) { reject(new Error('Invalid JSON: ' + body.substring(0, 500))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function formatPrice(val) {
  if (!val || val === 0) return '';
  return Number(val).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300'
  };

  const token = process.env.ONOFFICE_API_TOKEN;
  const secret = process.env.ONOFFICE_API_SECRET;

  if (!token || !secret) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API not configured' }) };
  }

  try {
    // Debug: erst ohne Filter testen
    const result = await apiRequest(token, secret,
      'urn:onoffice-de-ns:smart:2.5:smartml:action:read',
      'estate',
      {
        data: [
          'Id', 'objektnr_extern', 'objekttitel', 'objektart', 'objekttyp',
          'strasse', 'hausnummer', 'plz', 'ort',
          'kaufpreis', 'wohnflaeche', 'nutzflaeche', 'anzahl_zimmer',
          'anzahl_badezimmer', 'grundstuecksflaeche', 'baujahr',
          'objektbeschreibung', 'status', 'status2'
        ],
        listlimit: 100
      }
    );

    // Debug: Felder-Liste abfragen
    if (event.queryStringParameters && event.queryStringParameters.debug === 'fields') {
      const fieldsResult = await apiRequest(token, secret,
        'urn:onoffice-de-ns:smart:2.5:smartml:action:get',
        'fields',
        { labels: true, language: 'DEU', modules: ['estate'] }
      );
      return { statusCode: 200, headers, body: JSON.stringify({ raw: fieldsResult?.response?.results?.[0] }, null, 2) };
    }

    // Debug: rohe Antwort loggen
    if (event.queryStringParameters && event.queryStringParameters.debug === '1') {
      return { statusCode: 200, headers, body: JSON.stringify({ apiResponse: result }, null, 2) };
    }

    const records = result?.response?.results?.[0]?.data?.records || [];

    const items = records.map((r, i) => {
      const d = r.elements || {};
      const street = [d.strasse, d.hausnummer].filter(Boolean).join(' ');
      const address = street + (d.ort ? ', ' + (d.plz ? d.plz + ' ' : '') + d.ort : '');
      const size = d.wohnflaeche || d.nutzflaeche || '';
      const rooms = d.anzahl_zimmer ? (d.anzahl_zimmer % 1 === 0 ? Math.round(d.anzahl_zimmer) : d.anzahl_zimmer) : null;

      let status = 'Verfügbar';
      if (d.status === '2' || d.status === 'Reserviert') status = 'Reserviert';
      if (d.status === '3' || d.status === 'Verkauft') status = 'Verkauft';

      return {
        id: r.id || i + 1,
        objnr: d.objektnr_extern || '',
        title: d.objekttitel || (d.objektart + ' ' + d.ort),
        address,
        price: formatPrice(d.kaufpreis),
        size: size ? Math.round(Number(size)).toString() : '',
        rooms,
        bathrooms: d.anzahl_badezimmer ? Math.round(Number(d.anzahl_badezimmer)) : null,
        plot: d.grundstuecksflaeche ? Math.round(Number(d.grundstuecksflaeche)).toString() : '',
        year: d.baujahr && d.baujahr !== '0' ? parseInt(d.baujahr) : null,
        status,
        description: d.objektbeschreibung || '',
        energyClass: d.energieeffizienzklasse || null,
        energyValue: d.endenergieverbrauch && d.endenergieverbrauch !== '0' ? String(d.endenergieverbrauch) : null,
        secret_sale: false,
        image: null,
        images: []
      };
    }).filter(p => p.objnr);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ items })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Fehler beim Laden der Immobilien', details: error.message })
    };
  }
};
