# DreamForge

DreamForge is a private worldbuilding application built with SvelteKit, Drizzle ORM, SQLite, Better Auth, Tailwind CSS, and Skeleton UI v2.

Each user gets their own private workspace. Universes, trait definitions, characters, uploads, and media access are all scoped to the authenticated account that created them.

## Stack

- SvelteKit with TypeScript and SSR
- SQLite via Drizzle ORM and better-sqlite3
- Better Auth email/password authentication
- Tailwind CSS with Skeleton UI v2 theming
- Local filesystem media storage under a shared data root

## What is implemented

- Registration and login flows
- Explicit first-run universe onboarding after signup
- Universe-level trait definitions stored in Drizzle
- Character directory and character detail pages
- Character creation with markdown bio and JSON trait values
- Private image gallery with upload form
- Private media streaming route at `/media/[filename]`
- Shared `DATA_PATH` storage model for both SQLite and uploads

## Key routes

- `/login`
- `/register`
- `/onboarding/universe`
- `/characters`
- `/characters/create`
- `/characters/[id]`
- `/gallery`
- `POST /api/upload`
- `POST /logout`
- `/media/[filename]`

## Environment

Copy `.env.example` to `.env` and set these values:

```env
DATA_PATH=./data
ORIGIN=http://localhost:5173
BETTER_AUTH_SECRET=replace-with-a-random-secret
```

Optional overrides:

```env
DATABASE_URL=./data/dreamforge.sqlite
UPLOADS_DIR=uploads
```

Behavior:

- If `DATABASE_URL` is not set, DreamForge stores SQLite at `DATA_PATH/dreamforge.sqlite`.
- Uploads are stored at `DATA_PATH/uploads` by default.
- The app creates the data and upload directories automatically at startup.

## Local development

Install dependencies:

```sh
pnpm install
```

Start the dev server:

```sh
pnpm dev
```

Typecheck the project:

```sh
pnpm check
```

Apply the schema to the local SQLite database:

```sh
pnpm db:push
```

If you need to regenerate Better Auth table definitions:

```sh
pnpm auth:schema
```

## Database model

DreamForge adds these application tables on top of the Better Auth tables:

- `universes`
- `universe_trait_definitions`
- `characters`
- `character_trait_values`
- `images`
- `character_images`

Ownership is enforced both in application queries and through `owner_id` foreign keys back to the Better Auth `user` table.

## Upload and media flow

1. `POST /api/upload` accepts an image file and validates `image/*` MIME types.
2. The file is written into the configured uploads directory under `DATA_PATH`.
3. An `images` row is inserted into SQLite.
4. If a `characterId` is provided, DreamForge creates the join row in `character_images`.
5. `/media/[filename]` checks the current session, verifies the file belongs to the signed-in user, and streams it from disk.

## Project structure

Relevant implementation files:

- `src/lib/server/storage.ts`
- `src/lib/server/db/index.ts`
- `src/lib/server/db/schema.ts`
- `src/lib/server/dreamforge/queries.ts`
- `src/lib/server/dreamforge/mutations.ts`
- `src/routes/(app)/characters/**`
- `src/routes/(app)/gallery/**`
- `src/routes/(app)/onboarding/universe/**`
- `src/routes/api/upload/+server.ts`
- `src/routes/media/[filename]/+server.ts`

## Notes

- Character detail pages render markdown after server-side sanitization.
- Media is private for now. Files are not served from `static/`.
- The route and schema structure are ready for future universe sharing, public pages, relationship tracking, and bulk character views.
