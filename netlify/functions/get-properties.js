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

    const allRecords = result?.response?.results?.[0]?.data?.records || [];
    const records = allRecords.filter(r => r.elements?.status2 === 'aktive_vermarktung');

    // Fotos für gefilterte Objekte laden
    const photoPromises = records.map(r => {
      return apiRequest(token, secret,
        'urn:onoffice-de-ns:smart:2.5:smartml:action:get',
        'estatepictures',
        { estateids: [r.id], categories: ['Titelbild', 'Foto', 'Aussenansichten'], size: '640x480' }
      ).catch(() => null);
    });
    const photoResults = await Promise.all(photoPromises);

    const items = records.map((r, i) => {
      const d = r.elements || {};
      const street = [d.strasse, d.hausnummer].filter(Boolean).join(' ');
      const address = street + (d.ort ? ', ' + (d.plz ? d.plz + ' ' : '') + d.ort : '');
      const size = d.wohnflaeche || d.nutzflaeche || '';
      const rooms = d.anzahl_zimmer ? (d.anzahl_zimmer % 1 === 0 ? Math.round(d.anzahl_zimmer) : d.anzahl_zimmer) : null;

      let status = 'Verfügbar';
      if (d.status === '2' || d.status === 'Reserviert') status = 'Reserviert';
      if (d.status === '3' || d.status === 'Verkauft') status = 'Verkauft';

      // Fotos extrahieren
      const photoData = photoResults[i]?.response?.results?.[0]?.data?.records || [];
      const photos = photoData.flatMap(p => {
        const els = Array.isArray(p.elements) ? p.elements : [p.elements];
        return els.map(e => e?.url).filter(Boolean);
      });
      const titleInLower = (d.objekttitel || '').toLowerCase();
      const isSecret = titleInLower.includes('diskret') || titleInLower.includes('secret');

      return {
        id: r.id || i + 1,
        objnr: d.objektnr_extern || '',
        title: d.objekttitel || (d.objektart + ' ' + d.ort),
        address,
        price: formatPrice(d.kaufpreis),
        size: size && Number(size) > 0 ? Math.round(Number(size)).toString() : '',
        rooms: rooms && rooms > 0 ? rooms : null,
        bathrooms: d.anzahl_badezimmer && Number(d.anzahl_badezimmer) > 0 ? Math.round(Number(d.anzahl_badezimmer)) : null,
        plot: d.grundstuecksflaeche && Number(d.grundstuecksflaeche) > 0 ? Math.round(Number(d.grundstuecksflaeche)).toString() : '',
        year: d.baujahr && d.baujahr !== '0' ? parseInt(d.baujahr) : null,
        status,
        description: d.objektbeschreibung || '',
        energyClass: null,
        energyValue: null,
        secret_sale: isSecret,
        image: photos[0] || null,
        images: photos
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
