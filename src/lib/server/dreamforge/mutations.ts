import { and, eq, notInArray } from 'drizzle-orm';
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
	category?: string;
	valueType?: TraitValueType;
	options?: string[];
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
		tx.insert(universes)
			.values({
				id: universeId,
				ownerId: userId,
				name,
				summary: input.summary?.trim() ?? '',
				createdAt: now,
				updatedAt: now
			})
			.run();

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

export function updateCharacterBasic(
	userId: string,
	characterId: string,
	input: { name: string; summary: string; traitValues?: Record<string, string> }
) {
	const name = input.name.trim();

	if (!name) {
		throw new DreamForgeError('Character name is required.');
	}

	const character = db
		.select()
		.from(characters)
		.where(and(eq(characters.id, characterId), eq(characters.ownerId, userId)))
		.get();

	if (!character) {
		throw new DreamForgeError('Character not found.', 404);
	}

	const now = new Date();

	if (input.traitValues !== undefined) {
		const definitions = db
			.select()
			.from(universeTraitDefinitions)
			.where(eq(universeTraitDefinitions.universeId, character.universeId))
			.all();

		const definitionMap = new Map(definitions.map((d) => [d.key, d]));

		for (const key of Object.keys(input.traitValues)) {
			if (!definitionMap.has(key)) {
				throw new DreamForgeError(`Unknown trait key: ${key}`);
			}
		}

		db.transaction((tx) => {
			tx.update(characters)
				.set({ name, summary: input.summary.trim(), updatedAt: now })
				.where(eq(characters.id, characterId))
				.run();

			for (const def of definitions) {
				const value = input.traitValues![def.key]?.trim() ?? '';

				if (value) {
					tx.insert(characterTraitValues)
						.values({
							characterId,
							traitDefinitionId: def.id,
							value,
							createdAt: now,
							updatedAt: now
						})
						.onConflictDoUpdate({
							target: [
								characterTraitValues.characterId,
								characterTraitValues.traitDefinitionId
							],
							set: { value, updatedAt: now }
						})
						.run();
				} else {
					tx.delete(characterTraitValues)
						.where(
							and(
								eq(characterTraitValues.characterId, characterId),
								eq(characterTraitValues.traitDefinitionId, def.id)
							)
						)
						.run();
				}
			}
		});
	} else {
		db.update(characters)
			.set({ name, summary: input.summary.trim(), updatedAt: now })
			.where(and(eq(characters.id, characterId), eq(characters.ownerId, userId)))
			.run();
	}
}

export function updateCharacter(userId: string, characterId: string, input: CharacterInput) {
	const name = input.name.trim();

	if (!name) {
		throw new DreamForgeError('Character name is required.');
	}

	const character = db
		.select()
		.from(characters)
		.where(and(eq(characters.id, characterId), eq(characters.ownerId, userId)))
		.get();

	if (!character) {
		throw new DreamForgeError('Character not found.', 404);
	}

	const definitions = db
		.select()
		.from(universeTraitDefinitions)
		.where(eq(universeTraitDefinitions.universeId, character.universeId))
		.all();

	const definitionMap = new Map(definitions.map((d) => [d.key, d]));
	const traitValues = input.traitValues ?? {};

	for (const key of Object.keys(traitValues)) {
		if (!definitionMap.has(key)) {
			throw new DreamForgeError(`Unknown trait key: ${key}`);
		}
	}

	const now = new Date();

	db.transaction((tx) => {
		tx.update(characters)
			.set({
				name,
				summary: input.summary?.trim() ?? '',
				bioMarkdown: input.bioMarkdown?.trim() ?? '',
				updatedAt: now
			})
			.where(eq(characters.id, characterId))
			.run();

		for (const definition of definitions) {
			const value = traitValues[definition.key]?.trim() ?? '';

			if (value) {
				tx.insert(characterTraitValues)
					.values({
						characterId,
						traitDefinitionId: definition.id,
						value,
						createdAt: now,
						updatedAt: now
					})
					.onConflictDoUpdate({
						target: [
							characterTraitValues.characterId,
							characterTraitValues.traitDefinitionId
						],
						set: { value, updatedAt: now }
					})
					.run();
			} else {
				tx.delete(characterTraitValues)
					.where(
						and(
							eq(characterTraitValues.characterId, characterId),
							eq(characterTraitValues.traitDefinitionId, definition.id)
						)
					)
					.run();
			}
		}
	});
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

export function updateUniverse(
	userId: string,
	universeId: string,
	input: { name: string; summary: string }
) {
	const name = input.name.trim();

	if (!name) {
		throw new DreamForgeError('Universe name is required.');
	}

	const result = db
		.update(universes)
		.set({ name, summary: input.summary.trim(), updatedAt: new Date() })
		.where(and(eq(universes.id, universeId), eq(universes.ownerId, userId)))
		.run();

	if (result.changes === 0) {
		throw new DreamForgeError('Universe not found.', 404);
	}
}

export function updateUniverseTraits(
	userId: string,
	universeId: string,
	newDefinitions: TraitDefinitionInput[]
) {
	const universe = db
		.select({ id: universes.id })
		.from(universes)
		.where(and(eq(universes.id, universeId), eq(universes.ownerId, userId)))
		.get();

	if (!universe) {
		throw new DreamForgeError('Universe not found.', 404);
	}

	const normalized = normalizeTraitDefinitions(newDefinitions);
	const now = new Date();

	const existing = db
		.select()
		.from(universeTraitDefinitions)
		.where(eq(universeTraitDefinitions.universeId, universeId))
		.all();

	const existingByKey = new Map(existing.map((d) => [d.key, d]));
	const retainedKeys = normalized.map((d) => d.key);

	db.transaction((tx) => {
		// Delete traits whose keys are no longer present
		if (retainedKeys.length > 0) {
			tx.delete(universeTraitDefinitions)
				.where(
					and(
						eq(universeTraitDefinitions.universeId, universeId),
						notInArray(universeTraitDefinitions.key, retainedKeys)
					)
				)
				.run();
		} else {
			tx.delete(universeTraitDefinitions)
				.where(eq(universeTraitDefinitions.universeId, universeId))
				.run();
		}

		// Upsert each definition in order
		normalized.forEach((def, index) => {
			const existingDef = existingByKey.get(def.key);

			if (existingDef) {
				tx.update(universeTraitDefinitions)
					.set({
						label: def.label,
						description: def.description,
						category: def.category,
						valueType: def.valueType,
						position: index,
						updatedAt: now
					})
					.where(eq(universeTraitDefinitions.id, existingDef.id))
					.run();
			} else {
				tx.insert(universeTraitDefinitions)
					.values({
						id: crypto.randomUUID(),
						universeId,
						key: def.key,
						label: def.label,
						description: def.description,
						category: def.category,
						valueType: def.valueType,
						optionsJson: JSON.stringify(def.options),
						position: index,
						createdAt: now,
						updatedAt: now
					})
					.run();
			}
		});
	});
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
				category: definition.category?.trim() ?? '',
				valueType: definition.valueType ?? 'text',
				options: definition.options ?? []
			};
		})
		.filter(Boolean);
}
