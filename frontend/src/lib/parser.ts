export interface FirearmRecord {
  applicationType: string;
  applicationNumber: string;
  calibre: string;
  make: string;
  serialNumber: string;
  statusDate: string;
  status: string;
  statusDescription: string;
  nextStep: string;
}

/**
 * Parse firearm status HTML response using regex
 * Looks for the results table with class 'table table-bordered table-hover table-striped'
 * and extracts all rows, mapping them to FirearmRecord objects
 */
export function parseFirearmStatusHtml(html: string): { records: FirearmRecord[]; noRecords?: { type: 'REF_ONLY' | 'REF_AND_SERIAL'; reference?: string; serial?: string; message: string } } {
  if (!html || typeof html !== 'string') {
    return { records: [] };
  }

  // Detect explicit 'No records' messages which indicate an incorrect input
  const noRecordsRefAndSerial = /No records to retrieve for your selected Reference Number\s*\(([^)]+)\)\s*and Serial Number\s*\(([^)]+)\)/i;
  const noRecordsRefOnly = /No records to retrieve for your selected Reference Number\s*\(([^)]+)\)/i;

  const mRefAndSerial = html.match(noRecordsRefAndSerial);
  if (mRefAndSerial) {
    return {
      records: [],
      noRecords: {
        type: 'REF_AND_SERIAL',
        reference: mRefAndSerial[1],
        serial: mRefAndSerial[2],
        message: mRefAndSerial[0]
      }
    };
  }

  const mRefOnly = html.match(noRecordsRefOnly);
  if (mRefOnly) {
    return {
      records: [],
      noRecords: {
        type: 'REF_ONLY',
        reference: mRefOnly[1],
        message: mRefOnly[0]
      }
    };
  }

  // Look for the table containing results
  const tableMatch = html.match(/<table[^>]*class=['"]?table\s+table-bordered\s+table-hover\s+table-striped['"]?[^>]*>([\s\S]*?)<\/table>/i);

  if (!tableMatch) {
    return { records: [] };
  }

  const tableContent = tableMatch[1];

  // Extract all rows (skip header row)
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[] = [];
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowPattern.exec(tableContent)) !== null) {
    rows.push(rowMatch[1]);
  }

  // Skip the header row (first row), process data rows
  const records: FirearmRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Extract all cells from the row
    const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellPattern.exec(row)) !== null) {
      // Clean up cell content: remove HTML tags, trim whitespace
      let cellText = cellMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&')
        .trim();

      cells.push(cellText);
    }

    // Map cells to FirearmRecord (expects at least 9 columns)
    if (cells.length >= 9) {
      const record: FirearmRecord = {
        applicationType: cells[0] || '',
        applicationNumber: cells[1] || '',
        calibre: cells[2] || '',
        make: cells[3] || '',
        serialNumber: cells[4] || '',
        statusDate: cells[5] || '',
        status: cells[6] || '',
        statusDescription: cells[7] || '',
        nextStep: cells[8] || ''
      };

      records.push(record);
    }
  }

  return { records };
}
