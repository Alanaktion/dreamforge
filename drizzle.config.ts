import { defineConfig } from 'drizzle-kit';
import { resolveStoragePaths } from './src/lib/server/storage';

const storage = resolveStoragePaths(process.env);

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: { url: storage.databaseFilePath },
	verbose: true,
	strict: true
});
