import { dirname, isAbsolute, join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

type StorageEnv = {
	DATA_PATH?: string;
	DATABASE_URL?: string;
	UPLOADS_DIR?: string;
};

export type StoragePaths = {
	dataRoot: string;
	databaseFilePath: string;
	uploadsDirectory: string;
	uploadsPublicPrefix: string;
};

export function resolveStoragePaths(env: StorageEnv): StoragePaths {
	const dataRoot = resolve(env.DATA_PATH || 'data');
	const uploadsDirectory = join(dataRoot, env.UPLOADS_DIR || 'uploads');
	const databaseFilePath = resolveDatabasePath(env.DATABASE_URL, dataRoot);

	return {
		dataRoot,
		databaseFilePath,
		uploadsDirectory,
		uploadsPublicPrefix: '/media'
	};
}

export function ensureStorageDirectories(paths: StoragePaths): void {
	mkdirSync(paths.dataRoot, { recursive: true });
	mkdirSync(paths.uploadsDirectory, { recursive: true });

	if (paths.databaseFilePath !== ':memory:' && !paths.databaseFilePath.startsWith('file:')) {
		mkdirSync(dirname(paths.databaseFilePath), { recursive: true });
	}
}

export function resolveUploadPath(paths: StoragePaths, filename: string): string {
	return join(paths.uploadsDirectory, filename);
}

function resolveDatabasePath(databaseUrl: string | undefined, dataRoot: string): string {
	if (!databaseUrl) {
		return join(dataRoot, 'dreamforge.sqlite');
	}

	if (databaseUrl === ':memory:' || databaseUrl.startsWith('file:')) {
		return databaseUrl;
	}

	return isAbsolute(databaseUrl) ? databaseUrl : resolve(databaseUrl);
}
