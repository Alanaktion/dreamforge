import { error, fail, redirect } from '@sveltejs/kit';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Actions, PageServerLoad } from './$types';
import { parseCSV } from '$lib/server/csv';
import { storage } from '$lib/server/db';
import {
	DreamForgeError,
	importCharacters,
	type ColumnMapping
} from '$lib/server/dreamforge/mutations';
import { getUniverseWithTraitsForUser } from '$lib/server/dreamforge/queries';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function getTmpDir(): string {
	const dir = join(storage.uploadsDirectory, 'tmp');
	mkdirSync(dir, { recursive: true });
	return dir;
}

function autoDetectMappings(
	headers: string[],
	traitDefs: { key: string; label: string }[]
): ColumnMapping[] {
	const namePatterns = new Set([
		'name',
		'character name',
		'character',
		'full name',
		'first name',
		'first_name',
		'firstname',
		'given name',
		'given_name',
		'last name',
		'last_name',
		'lastname',
		'surname',
		'family name',
		'family_name',
		'middle name',
		'middle_name',
		'middlename'
	]);

	return headers.map((header, i) => {
		const normalized = header.toLowerCase().trim();

		const traitMatch = traitDefs.find(
			(td) => td.label.toLowerCase() === normalized || td.key.toLowerCase() === normalized
		);
		if (traitMatch) return { type: 'trait', key: traitMatch.key };

		if (i === 0 || namePatterns.has(normalized)) return { type: 'name' };

		return { type: 'skip' };
	});
}

function parseColumnMappings(raw: string): ColumnMapping[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new DreamForgeError('Invalid column mapping data.');
	}
	if (!Array.isArray(parsed)) throw new DreamForgeError('Column mappings must be an array.');

	return parsed.map((m): ColumnMapping => {
		if (!m || typeof m !== 'object') throw new DreamForgeError('Invalid column mapping entry.');
		const entry = m as Record<string, unknown>;
		switch (entry.type) {
			case 'skip':
				return { type: 'skip' };
			case 'name':
				return { type: 'name' };
			case 'trait':
				if (typeof entry.key !== 'string' || !entry.key.trim())
					throw new DreamForgeError('Trait mapping requires a key.');
				return { type: 'trait', key: entry.key.trim() };
			case 'new_trait': {
				const label = typeof entry.label === 'string' ? entry.label.trim() : '';
				const key = typeof entry.key === 'string' ? entry.key.trim() : '';
				if (!label) throw new DreamForgeError('New trait mapping requires a label.');
				if (!key) throw new DreamForgeError('New trait mapping requires a key.');
				const valueType =
					entry.valueType === 'paragraph' ||
					entry.valueType === 'number' ||
					entry.valueType === 'boolean' ||
					entry.valueType === 'date' ||
					entry.valueType === 'json'
						? entry.valueType
						: 'text';
				return { type: 'new_trait', label, key, valueType };
			}
			default:
				return { type: 'skip' };
		}
	});
}

export const load: PageServerLoad = ({ locals, params }) => {
	const detail = getUniverseWithTraitsForUser(locals.user!.id, params.id);
	if (!detail) throw error(404, 'Universe not found.');
	return detail;
};

export const actions: Actions = {
	upload: async ({ locals, params, request }) => {
		const detail = getUniverseWithTraitsForUser(locals.user!.id, params.id);
		if (!detail) throw error(404, 'Universe not found.');

		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File) || !file.name) {
			return fail(400, { step: 'upload' as const, message: 'Please select a CSV file.' });
		}
		if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
			return fail(400, { step: 'upload' as const, message: 'File must be a .csv file.' });
		}
		if (file.size > MAX_FILE_SIZE) {
			return fail(400, { step: 'upload' as const, message: 'File exceeds the 10 MB limit.' });
		}

		const text = await file.text();
		const allRows = parseCSV(text);

		if (allRows.length < 2) {
			return fail(400, {
				step: 'upload' as const,
				message: 'The CSV must have a header row and at least one data row.'
			});
		}

		const [headers, ...dataRows] = allRows;
		const sampleRows = dataRows.slice(0, 5);
		const totalRows = dataRows.length;
		const autoMappings = autoDetectMappings(headers, detail.traitDefinitions);

		const tempFileId = crypto.randomUUID();
		writeFileSync(join(getTmpDir(), `${tempFileId}.csv`), text, 'utf-8');

		return {
			step: 'map' as const,
			tempFileId,
			headers,
			sampleRows,
			totalRows,
			autoMappings
		};
	},

	import: async ({ locals, params, request }) => {
		const detail = getUniverseWithTraitsForUser(locals.user!.id, params.id);
		if (!detail) throw error(404, 'Universe not found.');

		const formData = await request.formData();
		const tempFileId = formData.get('tempFileId')?.toString() ?? '';
		const columnMappingsRaw = formData.get('columnMappings')?.toString() ?? '';

		if (!UUID_RE.test(tempFileId)) {
			return fail(400, {
				step: 'upload' as const,
				message: 'Invalid import session. Please re-upload your file.'
			});
		}

		let columnMappings: ColumnMapping[];
		try {
			columnMappings = parseColumnMappings(columnMappingsRaw);
		} catch (err) {
			return fail(400, {
				step: 'upload' as const,
				message: err instanceof DreamForgeError ? err.message : 'Invalid column mapping data.'
			});
		}

		const tmpPath = join(getTmpDir(), `${tempFileId}.csv`);
		let text: string;
		try {
			text = readFileSync(tmpPath, 'utf-8');
		} catch {
			return fail(400, {
				step: 'upload' as const,
				message: 'Import session expired or file not found. Please re-upload your file.'
			});
		}

		const allRows = parseCSV(text);
		const dataRows = allRows.slice(1); // skip header

		let result: { imported: number; failed: { row: number; reason: string }[] };
		try {
			result = importCharacters(locals.user!.id, params.id, columnMappings, dataRows);
		} catch (err) {
			try {
				rmSync(tmpPath);
			} catch {}
			if (err instanceof DreamForgeError) {
				return fail(err.status, { step: 'upload' as const, message: err.message });
			}
			throw err;
		}

		try {
			rmSync(tmpPath);
		} catch {}

		if (result.failed.length === 0) {
			throw redirect(
				303,
				`/characters/table?universe=${params.id}&imported=${result.imported}`
			);
		}

		return {
			step: 'results' as const,
			imported: result.imported,
			failed: result.failed
		};
	}
};
