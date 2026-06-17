// Parst den onOffice CSV-Export und erzeugt data/properties.json
const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2] || 'Immobilien.csv';
const outputPath = path.join(__dirname, '..', 'data', 'properties.json');

const raw = fs.readFileSync(csvPath, 'utf-8').replace(/^﻿/, ''); // BOM entfernen

// CSV parsen (Semikolon-getrennt, Felder in Anführungszeichen, Zeilenumbrüche in Feldern möglich)
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ';') { row.push(field.trim()); field = ''; }
      else if (ch === '\n') {
        row.push(field.trim()); field = '';
        if (row.some(f => f !== '')) rows.push(row);
        row = [];
      } else if (ch === '\r') { /* skip */ }
      else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(f => f !== '')) rows.push(row); }
  return rows;
}

const rows = parseCSV(raw);
if (rows.length < 2) { console.log('Keine Daten in CSV'); process.exit(0); }

const headers = rows[0];
const dataRows = rows.slice(1);

function col(row, name) {
  const idx = headers.indexOf(name);
  return idx >= 0 ? (row[idx] || '').replace(/^"|"$/g, '') : '';
}

function formatPrice(val) {
  const num = parseFloat(val.replace(',', '.'));
  if (!num || num === 0) return '';
  return num.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatArea(val) {
  const num = parseFloat(val.replace(',', '.'));
  if (!num || num === 0) return '';
  return Math.round(num).toString();
}

function formatRooms(val) {
  const num = parseFloat(val.replace(',', '.'));
  if (!num || num === 0) return null;
  return num % 1 === 0 ? Math.round(num) : num;
}

const items = dataRows.map((row, i) => {
  const objnr    = col(row, 'ImmoNr');
  const status   = col(row, 'Status');
  const title    = col(row, 'Objekttitel');
  const street   = col(row, 'Straße');
  const nr       = col(row, 'Hausnummer');
  const plz      = col(row, 'PLZ');
  const ort      = col(row, 'Ort');
  const price    = col(row, 'Kaufpreis');
  const size     = col(row, 'Wohnfläche') || col(row, 'Nutzfläche');
  const rooms    = col(row, 'Anzahl Zimmer');
  const baths    = col(row, 'Anzahl Badezimmer');
  const plot     = col(row, 'Grundstücksgröße');
  const year     = col(row, 'Baujahr');
  const desc     = col(row, 'Beschreibung Portale');
  const energy   = col(row, 'Energieeffizienzklasse');
  const energyV  = col(row, 'Endenergieverbrauch');
  const publish  = col(row, 'veröffentlichen');
  const objType  = col(row, 'Objektart');

  const address = [street, nr].filter(Boolean).join(' ') + (ort ? ', ' + (plz ? plz + ' ' : '') + ort : '');

  // Status mapping
  let mappedStatus = 'Verfügbar';
  if (status === 'Verkauft') mappedStatus = 'Verkauft';
  if (status === 'Reserviert') mappedStatus = 'Reserviert';

  return {
    id: i + 1,
    objnr,
    title: title || (objType + ' ' + ort),
    address,
    price: formatPrice(price),
    size: formatArea(size),
    rooms: formatRooms(rooms),
    bathrooms: formatRooms(baths),
    plot: formatArea(plot),
    year: year && year !== '0' ? parseInt(year) : null,
    status: mappedStatus,
    description: desc,
    energyClass: energy || null,
    energyValue: energyV && energyV !== '0,00' ? energyV.replace(',', '.') : null,
    secret_sale: false,
    slug: null,
    image: null,
    images: []
  };
}).filter(p => p.objnr); // nur Zeilen mit Objekt-Nr.

const output = { items };
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`✓ ${items.length} Objekte nach data/properties.json exportiert`);
