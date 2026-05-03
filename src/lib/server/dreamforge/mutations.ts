import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	characterImages,
	characters,
	characterTraitValues,
	images,
	universeTraitDefinitions,
	universes
} from '$lib/server/db/schema';
import type { TraitValueType } from '$lib/server/db/schema';

export class DreamForgeError extends Error {
	constructor(
		message: string,
		readonly status = 400
	) {
		super(message);
	}
}

export type TraitDefinitionInput = {
	key: string;
	label: string;
	description?: string;
	valueType?: TraitValueType;
	options?: string[];
	isRequired?: boolean;
};

export type CharacterInput = {
	universeId: string;
	name: string;
	summary?: string;
	bioMarkdown?: string;
	traitValues?: Record<string, string>;
};

export type ImageInput = {
	filename: string;
	originalFilename: string;
	altText?: string;
	filePath: string;
	mimeType: string;
	characterId?: string;
	universeId?: string;
};

export function createUniverse(
	userId: string,
	input: {
		name: string;
		summary?: string;
		traitDefinitions: TraitDefinitionInput[];
	}
) {
	const name = input.name.trim();

	if (!name) {
		throw new DreamForgeError('Universe name is required.');
	}

	const universeId = crypto.randomUUID();
	const now = new Date();

	db.transaction((tx) => {
		tx.insert(universes).values({
			id: universeId,
			ownerId: userId,
			name,
			summary: input.summary?.trim() ?? '',
			createdAt: now,
			updatedAt: now
		}).run();

		const definitions = normalizeTraitDefinitions(input.traitDefinitions);

		if (definitions.length) {
			tx.insert(universeTraitDefinitions)
				.values(
					definitions.map((definition, index) => ({
						id: crypto.randomUUID(),
						universeId,
						key: definition.key,
						label: definition.label,
						description: definition.description,
						valueType: definition.valueType,
						optionsJson: JSON.stringify(definition.options),
						isRequired: definition.isRequired,
						position: index,
						createdAt: now,
						updatedAt: now
					}))
				)
				.run();
		}
	});

	return universeId;
}

export function createCharacter(userId: string, input: CharacterInput) {
	const name = input.name.trim();

	if (!name) {
		throw new DreamForgeError('Character name is required.');
	}

	const universe = db
		.select()
		.from(universes)
		.where(and(eq(universes.id, input.universeId), eq(universes.ownerId, userId)))
		.get();

	if (!universe) {
		throw new DreamForgeError('Universe not found.', 404);
	}

	const definitions = db
		.select()
		.from(universeTraitDefinitions)
		.where(eq(universeTraitDefinitions.universeId, universe.id))
		.all();

	const definitionMap = new Map(definitions.map((definition) => [definition.key, definition]));
	const traitValues = input.traitValues ?? {};

	for (const key of Object.keys(traitValues)) {
		if (!definitionMap.has(key)) {
			throw new DreamForgeError(`Unknown trait key: ${key}`);
		}
	}

	for (const definition of definitions) {
		if (definition.isRequired && !traitValues[definition.key]?.trim()) {
			throw new DreamForgeError(`Missing required trait: ${definition.label}`);
		}
	}

	const characterId = crypto.randomUUID();
	const now = new Date();

	db.transaction((tx) => {
		tx.insert(characters)
			.values({
				id: characterId,
				ownerId: userId,
				universeId: universe.id,
				name,
				summary: input.summary?.trim() ?? '',
				bioMarkdown: input.bioMarkdown?.trim() ?? '',
				createdAt: now,
				updatedAt: now
			})
			.run();

		const traitRows = definitions
			.filter((definition) => traitValues[definition.key]?.trim())
			.map((definition) => ({
				characterId,
				traitDefinitionId: definition.id,
				value: traitValues[definition.key].trim(),
				createdAt: now,
				updatedAt: now
			}));

		if (traitRows.length) {
			tx.insert(characterTraitValues).values(traitRows).run();
		}
	});

	return characterId;
}

export function createImage(userId: string, input: ImageInput) {
	const imageId = crypto.randomUUID();
	const now = new Date();
	let resolvedUniverseId = input.universeId ?? null;

	if (input.universeId) {
		const universe = db
			.select({ id: universes.id })
			.from(universes)
			.where(and(eq(universes.id, input.universeId), eq(universes.ownerId, userId)))
			.get();

		if (!universe) {
			throw new DreamForgeError('Universe not found for image.', 404);
		}
	}

	const linkedCharacter = input.characterId
		? db
				.select({ id: characters.id, universeId: characters.universeId })
				.from(characters)
				.where(and(eq(characters.id, input.characterId), eq(characters.ownerId, userId)))
				.get()
		: null;

	if (input.characterId && !linkedCharacter) {
		throw new DreamForgeError('Character not found for image link.', 404);
	}

	if (!resolvedUniverseId && linkedCharacter) {
		resolvedUniverseId = linkedCharacter.universeId;
	}

	db.transaction((tx) => {
		tx.insert(images)
			.values({
				id: imageId,
				ownerId: userId,
				universeId: resolvedUniverseId,
				filename: input.filename,
				originalFilename: input.originalFilename,
				altText: input.altText?.trim() ?? '',
				filePath: input.filePath,
				mimeType: input.mimeType,
				createdAt: now,
				updatedAt: now
			})
			.run();

		if (linkedCharacter) {
			tx.insert(characterImages)
				.values({
					characterId: linkedCharacter.id,
					imageId,
					createdAt: now
				})
				.run();
		}
	});

	return imageId;
}

function normalizeTraitDefinitions(definitions: TraitDefinitionInput[]) {
	const seenKeys = new Set<string>();

	return definitions
		.map((definition) => {
			const key = definition.key.trim();
			const label = definition.label.trim();

			if (!key || !label) {
				throw new DreamForgeError('Trait definitions require both key and label.');
			}

			if (seenKeys.has(key)) {
				throw new DreamForgeError(`Trait key must be unique: ${key}`);
			}

			seenKeys.add(key);

			return {
				key,
				label,
				description: definition.description?.trim() ?? '',
				valueType: definition.valueType ?? 'text',
				options: definition.options ?? [],
				isRequired: definition.isRequired ?? false
			};
		})
		.filter(Boolean);
}
