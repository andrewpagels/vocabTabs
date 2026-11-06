// scripts/csv.js — minimal RFC 4180 CSV parser (quoted fields, escaped quotes, newlines in quotes).
// eachCSVRow(text, cb): calls cb(fieldsArray) per record, including the header, without retaining rows.
// parseCSV(text, columns?): array of objects keyed by header; pass `columns` to keep only those.
function eachCSVRow(text, cb) {
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') cb(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); cb(row); }
}

function parseCSV(text, columns) {
  let header = null, idx = null;
  const out = [];
  eachCSVRow(text, (r) => {
    if (!header) {
      header = r;
      idx = (columns || header).map(name => [name, header.indexOf(name)]);
      return;
    }
    out.push(Object.fromEntries(idx.map(([name, i]) => [name, i < 0 || r[i] === undefined ? '' : r[i]])));
  });
  return out;
}

module.exports = { eachCSVRow, parseCSV };
