import { DreamForgeError } from '$lib/server/dreamforge/mutations';
import type { TraitDefinitionInput } from '$lib/server/dreamforge/mutations';

export function requireString(formData: FormData, key: string, label = key): string {
	const value = formData.get(key)?.toString().trim() ?? '';

	if (!value) {
		throw new DreamForgeError(`${label} is required.`);
	}

	return value;
}

export function optionalString(formData: FormData, key: string): string {
	return formData.get(key)?.toString().trim() ?? '';
}

export function parseTraitDefinitionsJson(raw: string): TraitDefinitionInput[] {
	if (!raw.trim()) {
		return [];
	}

	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new DreamForgeError('Trait definitions must be valid JSON.');
	}

	if (!Array.isArray(parsed)) {
		throw new DreamForgeError('Trait definitions must be a JSON array.');
	}

	return parsed.map((entry) => {
		if (!entry || typeof entry !== 'object') {
			throw new DreamForgeError('Each trait definition must be an object.');
		}

		const candidate = entry as Record<string, unknown>;

		return {
			key: String(candidate.key ?? ''),
			label: String(candidate.label ?? ''),
			category: String(candidate.category ?? ''),
			description: String(candidate.description ?? ''),
			valueType:
				candidate.valueType === 'paragraph' ||
				candidate.valueType === 'number' ||
				candidate.valueType === 'boolean' ||
				candidate.valueType === 'date' ||
				candidate.valueType === 'json'
					? candidate.valueType
					: 'text',
			options: Array.isArray(candidate.options)
				? candidate.options.map((value) => String(value))
				: []
		};
	});
}

export function parseTraitValuesFromFormData(
	formData: FormData,
	keys: string[]
): Record<string, string> {
	const values: Record<string, string> = {};

	for (const key of keys) {
		const value = formData.get(`trait:${key}`)?.toString().trim() ?? '';
		if (value) {
			values[key] = value;
		}
	}

	return values;
}
