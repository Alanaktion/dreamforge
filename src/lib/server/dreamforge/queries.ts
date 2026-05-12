import { and, asc, count, desc, eq, inArray, like } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	characterImages,
	characters,
	characterTraitValues,
	images,
	universeTraitDefinitions,
	universes
} from '$lib/server/db/schema';

export function getUniverseCountForUser(userId: string): number {
	const result = db
		.select({ count: count() })
		.from(universes)
		.where(eq(universes.ownerId, userId))
		.get();

	return result?.count ?? 0;
}

export function getUniversesForUser(userId: string) {
	return db
		.select()
		.from(universes)
		.where(eq(universes.ownerId, userId))
		.orderBy(asc(universes.name))
		.all();
}

export function getUniversesWithDetailsForUser(userId: string) {
	return getUniversesForUser(userId).map((universe) => ({
		...universe,
		traitCount:
			db
				.select({ count: count() })
				.from(universeTraitDefinitions)
				.where(eq(universeTraitDefinitions.universeId, universe.id))
				.get()?.count ?? 0,
		characterCount:
			db
				.select({ count: count() })
				.from(characters)
				.where(eq(characters.universeId, universe.id))
				.get()?.count ?? 0
	}));
}

export function getUniverseWithTraitsForUser(userId: string, universeId: string) {
	const universe = db
		.select()
		.from(universes)
		.where(and(eq(universes.id, universeId), eq(universes.ownerId, userId)))
		.get();

	if (!universe) {
		return null;
	}

	const traitDefinitions = db
		.select()
		.from(universeTraitDefinitions)
		.where(eq(universeTraitDefinitions.universeId, universe.id))
		.orderBy(asc(universeTraitDefinitions.position), asc(universeTraitDefinitions.label))
		.all();

	return { universe, traitDefinitions };
}

export function getUniversesWithTraitsForUser(userId: string) {
	const ownedUniverses = getUniversesForUser(userId);

	return ownedUniverses.map((universe) => ({
		...universe,
		traitDefinitions: db
			.select()
			.from(universeTraitDefinitions)
			.where(eq(universeTraitDefinitions.universeId, universe.id))
			.orderBy(asc(universeTraitDefinitions.position), asc(universeTraitDefinitions.label))
			.all()
	}));
}

export function getCharactersForUser(userId: string) {
	return db
		.select({
			id: characters.id,
			name: characters.name,
			summary: characters.summary,
			bioMarkdown: characters.bioMarkdown,
			createdAt: characters.createdAt,
			updatedAt: characters.updatedAt,
			universeId: characters.universeId,
			universeName: universes.name
		})
		.from(characters)
		.innerJoin(universes, eq(characters.universeId, universes.id))
		.where(eq(characters.ownerId, userId))
		.orderBy(desc(characters.updatedAt), asc(characters.name))
		.all();
}

export function getCharactersWithTraitsForUniverse(userId: string, universeId: string) {
	const universe = db
		.select()
		.from(universes)
		.where(and(eq(universes.id, universeId), eq(universes.ownerId, userId)))
		.get();

	if (!universe) return null;

	const traitDefinitions = db
		.select()
		.from(universeTraitDefinitions)
		.where(eq(universeTraitDefinitions.universeId, universeId))
		.orderBy(asc(universeTraitDefinitions.position), asc(universeTraitDefinitions.label))
		.all();

	const chars = db
		.select()
		.from(characters)
		.where(and(eq(characters.universeId, universeId), eq(characters.ownerId, userId)))
		.orderBy(asc(characters.name))
		.all();

	if (!chars.length) {
		return { universe, traitDefinitions, characters: [] as ReturnType<typeof buildCharRow>[] };
	}

	const charIds = chars.map((c) => c.id);

	const allTraitValues = db
		.select({
			characterId: characterTraitValues.characterId,
			traitDefinitionId: characterTraitValues.traitDefinitionId,
			value: characterTraitValues.value
		})
		.from(characterTraitValues)
		.where(inArray(characterTraitValues.characterId, charIds))
		.all();

	const traitMap = new Map<string, Map<string, string>>();
	for (const tv of allTraitValues) {
		if (!traitMap.has(tv.characterId)) traitMap.set(tv.characterId, new Map());
		traitMap.get(tv.characterId)!.set(tv.traitDefinitionId, tv.value);
	}

	function buildCharRow(c: (typeof chars)[number]) {
		return {
			id: c.id,
			name: c.name,
			summary: c.summary,
			bioMarkdown: c.bioMarkdown,
			createdAt: c.createdAt,
			updatedAt: c.updatedAt,
			universeId: c.universeId,
			universeName: universe!.name,
			traitValues: Object.fromEntries(
				traitDefinitions.map((td) => [td.key, traitMap.get(c.id)?.get(td.id) ?? ''])
			) as Record<string, string>
		};
	}

	return { universe, traitDefinitions, characters: chars.map(buildCharRow) };
}

export function getCharacterDetailForUser(userId: string, characterId: string) {
	const character = db
		.select({
			id: characters.id,
			name: characters.name,
			summary: characters.summary,
			bioMarkdown: characters.bioMarkdown,
			createdAt: characters.createdAt,
			updatedAt: characters.updatedAt,
			universeId: characters.universeId,
			universeName: universes.name,
			universeSummary: universes.summary
		})
		.from(characters)
		.innerJoin(universes, eq(characters.universeId, universes.id))
		.where(and(eq(characters.id, characterId), eq(characters.ownerId, userId)))
		.get();

	if (!character) {
		return null;
	}

	const traitValues = db
		.select({
			id: universeTraitDefinitions.id,
			key: universeTraitDefinitions.key,
			label: universeTraitDefinitions.label,
			description: universeTraitDefinitions.description,
			category: universeTraitDefinitions.category,
			valueType: universeTraitDefinitions.valueType,
			optionsJson: universeTraitDefinitions.optionsJson,
			value: characterTraitValues.value
		})
		.from(universeTraitDefinitions)
		.leftJoin(
			characterTraitValues,
			and(
				eq(characterTraitValues.traitDefinitionId, universeTraitDefinitions.id),
				eq(characterTraitValues.characterId, character.id)
			)
		)
		.where(eq(universeTraitDefinitions.universeId, character.universeId))
		.orderBy(asc(universeTraitDefinitions.position), asc(universeTraitDefinitions.label))
		.all();

	const linkedImages = db
		.select({
			id: images.id,
			filename: images.filename,
			originalFilename: images.originalFilename,
			altText: images.altText,
			filePath: images.filePath,
			mimeType: images.mimeType,
			createdAt: images.createdAt
		})
		.from(characterImages)
		.innerJoin(images, eq(characterImages.imageId, images.id))
		.where(and(eq(characterImages.characterId, character.id), eq(images.ownerId, userId)))
		.orderBy(desc(images.createdAt))
		.all();

	return {
		character,
		traitValues,
		linkedImages
	};
}

export function getGalleryImagesForUser(userId: string) {
	return db
		.select({
			id: images.id,
			filename: images.filename,
			originalFilename: images.originalFilename,
			altText: images.altText,
			filePath: images.filePath,
			mimeType: images.mimeType,
			createdAt: images.createdAt,
			universeId: images.universeId,
			universeName: universes.name
		})
		.from(images)
		.leftJoin(universes, eq(images.universeId, universes.id))
		.where(eq(images.ownerId, userId))
		.orderBy(desc(images.createdAt))
		.all();
}

export function getImageForUserByFilename(userId: string, filename: string) {
	return db
		.select()
		.from(images)
		.where(and(eq(images.ownerId, userId), eq(images.filename, filename)))
		.get();
}

export function searchCharactersByName(userId: string, query: string, limit = 10) {
	return db
		.select({
			id: characters.id,
			name: characters.name,
			universeName: universes.name
		})
		.from(characters)
		.innerJoin(universes, eq(characters.universeId, universes.id))
		.where(and(eq(characters.ownerId, userId), like(characters.name, `%${query}%`)))
		.orderBy(asc(characters.name))
		.limit(limit)
		.all();
}
