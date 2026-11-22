/*
 * Offline-Conversions: Anfrage als Zeile an die Google-Tabelle senden (Apps-Script-Web-App).
 * Umgebungsvariablen bei Netlify: SHEET_WEBHOOK_URL, SHEET_WEBHOOK_SECRET.
 * Ohne Einwilligung („Marketing & Werbung“ im Cookie-Banner) verwirft das Script
 * alle Anzeigen-Kennungen; die Anfrage selbst steht trotzdem in der Liste.
 * Fehler hier brechen den Formularversand nie ab.
 */
const https = require('https');

function clean(v, max) {
  if (v == null) return '';
  return String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max || 200);
}

function sendToSheet(row) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return Promise.resolve('kein SHEET_WEBHOOK_URL gesetzt');
  return new Promise((resolve) => {
    let target;
    try { target = new URL(url); } catch (e) { return resolve('ungültige SHEET_WEBHOOK_URL'); }
    const data = JSON.stringify({ secret: process.env.SHEET_WEBHOOK_SECRET || '', ...row });
    const req = https.request({
      hostname: target.hostname,
      path: target.pathname + target.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      // Apps Script antwortet nach dem Eintrag mit einer Weiterleitung (302) – das ist ein Erfolg
      res.on('data', () => {});
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', (e) => resolve('Fehler: ' + e.message));
    req.setTimeout(8000, () => { req.destroy(); resolve('Zeitüberschreitung'); });
    req.write(data);
    req.end();
  });
}

/* body = Anfrage vom Formular, felder = { name, tel, email, nachricht } */
async function anfrageAnTabelle(body, felder) {
  try {
    const gclid = clean(body.gclid), gbraid = clean(body.gbraid), wbraid = clean(body.wbraid);
    const utmSource = clean(body.utm_source, 100);
    const quelle = (gclid || gbraid || wbraid) ? 'Google-Anzeige'
      : (utmSource ? 'Kampagne: ' + utmSource : 'ohne Anzeigen-Kennung');
    const status = await sendToSheet({
      eingang: new Date().toISOString(),
      name: clean(felder.name, 120),
      tel: clean(felder.tel, 60),
      email: clean(felder.email, 160),
      nachricht: clean(felder.nachricht, 1000),
      quelle: quelle,
      seite: clean(body.seite, 150) || '/',
      gclid: gclid,
      gbraid: gbraid,
      wbraid: wbraid,
      utm_campaign: clean(body.utm_campaign, 150),
      utm_term: clean(body.utm_term, 150),
      einwilligung_google: body.ads_consent === true ? 'Ja' : 'Nein'
    });
    console.log('Google-Tabelle:', status);
  } catch (e) {
    console.error('Google-Tabelle Fehler:', e.message);
  }
}

module.exports = { anfrageAnTabelle };
