import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { ensureStorageDirectories, resolveStoragePaths } from '$lib/server/storage';

export const storage = resolveStoragePaths(env);

ensureStorageDirectories(storage);

const client = new Database(storage.databaseFilePath);

client.pragma('journal_mode = WAL');
client.pragma('foreign_keys = ON');

export const db = drizzle(client, { schema });
