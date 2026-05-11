/**
 * Parse a CSV string (RFC 4180) into a 2D array of strings.
 * Handles quoted fields, embedded commas, newlines within quotes, and escaped double-quotes ("").
 * Returns only non-empty rows.
 */
export function parseCSV(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let i = 0;
	const n = text.length;

	while (i < n) {
		let field = '';

		if (text[i] === '"') {
			// Quoted field
			i++; // skip opening quote
			while (i < n) {
				if (text[i] === '"') {
					if (i + 1 < n && text[i + 1] === '"') {
						// Escaped quote
						field += '"';
						i += 2;
					} else {
						i++; // skip closing quote
						break;
					}
				} else {
					field += text[i++];
				}
			}
			// Skip any unexpected characters before the next delimiter
			while (i < n && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') i++;
		} else {
			// Unquoted field
			while (i < n && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
				field += text[i++];
			}
		}

		row.push(field);

		if (i >= n) break;

		if (text[i] === ',') {
			i++; // next field in same row
		} else {
			// End of row
			if (text[i] === '\r') i++;
			if (i < n && text[i] === '\n') i++;
			if (row.some((cell) => cell !== '')) {
				rows.push(row);
			}
			row = [];
		}
	}

	// Handle final row (no trailing newline)
	if (row.length > 0 && row.some((cell) => cell !== '')) {
		rows.push(row);
	}

	return rows;
}
