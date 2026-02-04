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
export function parseFirearmStatusHtml(html: string): FirearmRecord[] {
  if (!html || typeof html !== 'string') {
    return [];
  }

  // Look for the table containing results
  const tableMatch = html.match(
    /<table[^>]*class='table\s+table-bordered\s+table-hover\s+table-striped'[^>]*>([\s\S]*?)<\/table>/i
  );

  if (!tableMatch) {
    return [];
  }

  const tableContent = tableMatch[1];

  // Extract all rows (skip header row)
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = [];
  let rowMatch;

  while ((rowMatch = rowPattern.exec(tableContent)) !== null) {
    rows.push(rowMatch[1]);
  }

  // Skip the header row (first row), process data rows
  const records: FirearmRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Extract all cells from the row
    const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells = [];
    let cellMatch;

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

    // Map cells to FirearmRecord (expects exactly 9 columns)
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

  return records;
}
