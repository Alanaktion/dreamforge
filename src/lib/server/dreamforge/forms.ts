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
			description: String(candidate.description ?? ''),
			valueType:
				candidate.valueType === 'number' ||
				candidate.valueType === 'boolean' ||
				candidate.valueType === 'json'
					? candidate.valueType
					: 'text',
			options: Array.isArray(candidate.options)
				? candidate.options.map((value) => String(value))
				: [],
			isRequired: Boolean(candidate.isRequired)
		};
	});
}

export function parseTraitValuesJson(raw: string): Record<string, string> {
	if (!raw.trim()) {
		return {};
	}

	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new DreamForgeError('Trait values must be valid JSON.');
	}

	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new DreamForgeError('Trait values must be a JSON object.');
	}

	return Object.fromEntries(
		Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, stringifyTraitValue(value)])
	);
}

function stringifyTraitValue(value: unknown): string {
	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}

	return JSON.stringify(value);
}
