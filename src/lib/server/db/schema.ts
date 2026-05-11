import { relations } from 'drizzle-orm';
import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

export type TraitValueType = 'text' | 'paragraph' | 'number' | 'boolean' | 'date' | 'json';

const timestamps = {
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
};

export const universes = sqliteTable(
	'universes',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ownerId: text('owner_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		summary: text('summary').notNull().default(''),
		visibility: text('visibility').notNull().default('private'),
		...timestamps
	},
	(table) => [index('universes_owner_idx').on(table.ownerId)]
);

export const universeTraitDefinitions = sqliteTable(
	'universe_trait_definitions',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		universeId: text('universe_id')
			.notNull()
			.references(() => universes.id, { onDelete: 'cascade' }),
		key: text('key').notNull(),
		label: text('label').notNull(),
		description: text('description').notNull().default(''),
		valueType: text('value_type').$type<TraitValueType>().notNull().default('text'),
		category: text('category').notNull().default(''),
		optionsJson: text('options_json').notNull().default('[]'),
		isRequired: integer('is_required', { mode: 'boolean' }).notNull().default(false),
		position: integer('position').notNull().default(0),
		...timestamps
	},
	(table) => [
		index('trait_definitions_universe_idx').on(table.universeId),
		uniqueIndex('trait_definitions_universe_key_idx').on(table.universeId, table.key)
	]
);

export const characters = sqliteTable(
	'characters',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ownerId: text('owner_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		universeId: text('universe_id')
			.notNull()
			.references(() => universes.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		summary: text('summary').notNull().default(''),
		bioMarkdown: text('bio_markdown').notNull().default(''),
		...timestamps
	},
	(table) => [
		index('characters_owner_idx').on(table.ownerId),
		index('characters_universe_idx').on(table.universeId),
		uniqueIndex('characters_universe_name_idx').on(table.universeId, table.name)
	]
);

export const images = sqliteTable(
	'images',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ownerId: text('owner_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		universeId: text('universe_id').references(() => universes.id, { onDelete: 'set null' }),
		filename: text('filename').notNull(),
		originalFilename: text('original_filename').notNull(),
		altText: text('alt_text').notNull().default(''),
		filePath: text('file_path').notNull(),
		mimeType: text('mime_type').notNull(),
		...timestamps
	},
	(table) => [
		index('images_owner_idx').on(table.ownerId),
		index('images_universe_idx').on(table.universeId),
		uniqueIndex('images_file_path_idx').on(table.filePath)
	]
);

export const characterImages = sqliteTable(
	'character_images',
	{
		characterId: text('character_id')
			.notNull()
			.references(() => characters.id, { onDelete: 'cascade' }),
		imageId: text('image_id')
			.notNull()
			.references(() => images.id, { onDelete: 'cascade' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		primaryKey({ columns: [table.characterId, table.imageId] }),
		index('character_images_image_idx').on(table.imageId)
	]
);

export const characterTraitValues = sqliteTable(
	'character_trait_values',
	{
		characterId: text('character_id')
			.notNull()
			.references(() => characters.id, { onDelete: 'cascade' }),
		traitDefinitionId: text('trait_definition_id')
			.notNull()
			.references(() => universeTraitDefinitions.id, { onDelete: 'cascade' }),
		value: text('value').notNull().default(''),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		primaryKey({ columns: [table.characterId, table.traitDefinitionId] }),
		index('character_trait_values_trait_idx').on(table.traitDefinitionId)
	]
);

export const universesRelations = relations(universes, ({ many }) => ({
	traitDefinitions: many(universeTraitDefinitions),
	characters: many(characters),
	images: many(images)
}));

export const universeTraitDefinitionsRelations = relations(
	universeTraitDefinitions,
	({ one, many }) => ({
		universe: one(universes, {
			fields: [universeTraitDefinitions.universeId],
			references: [universes.id]
		}),
		characterValues: many(characterTraitValues)
	})
);

export const charactersRelations = relations(characters, ({ one, many }) => ({
	universe: one(universes, {
		fields: [characters.universeId],
		references: [universes.id]
	}),
	traitValues: many(characterTraitValues),
	characterImages: many(characterImages)
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
	universe: one(universes, {
		fields: [images.universeId],
		references: [universes.id]
	}),
	characterImages: many(characterImages)
}));

export const characterImagesRelations = relations(characterImages, ({ one }) => ({
	character: one(characters, {
		fields: [characterImages.characterId],
		references: [characters.id]
	}),
	image: one(images, {
		fields: [characterImages.imageId],
		references: [images.id]
	})
}));

export const characterTraitValuesRelations = relations(characterTraitValues, ({ one }) => ({
	character: one(characters, {
		fields: [characterTraitValues.characterId],
		references: [characters.id]
	}),
	traitDefinition: one(universeTraitDefinitions, {
		fields: [characterTraitValues.traitDefinitionId],
		references: [universeTraitDefinitions.id]
	})
}));

export * from './auth.schema';
