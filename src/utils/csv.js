// CSV Parsing & Serialization Utilities (RFC 4180 Compliant)

export function parseCsv(text) {
  if (!text || typeof text !== 'string') return [];

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some(val => val.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(val => val.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(val => val.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.replace(/^["']|["']$/g, '').trim());
  const data = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const item = {};
    let hasValue = false;
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      if (header) {
        const val = row[c] !== undefined ? row[c] : '';
        item[header] = val;
        if (val !== '') hasValue = true;
      }
    }
    if (hasValue) data.push(item);
  }

  return data;
}

export function recordsToCsv(records, columns) {
  if (!records || records.length === 0) return '';
  const cols = columns || Object.keys(records[0]);

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = cols.map(c => escapeCell(c)).join(',');
  const dataRows = records.map(record => {
    return cols.map(c => escapeCell(record[c])).join(',');
  });

  return [headerRow, ...dataRows].join('\r\n');
}

