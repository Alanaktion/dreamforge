import { createReadStream, existsSync } from 'node:fs';
import { error } from '@sveltejs/kit';
import { Readable } from 'node:stream';
import type { RequestHandler } from './$types';
import { getImageForUserByFilename } from '$lib/server/dreamforge/queries';
import { storage } from '$lib/server/db';
import { resolveUploadPath } from '$lib/server/storage';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw error(401, 'Authentication required.');
	}

	const image = getImageForUserByFilename(locals.user.id, params.filename);

	if (!image) {
		throw error(404, 'Media not found.');
	}

	const filePath = resolveUploadPath(storage, image.filename);

	if (!existsSync(filePath)) {
		throw error(404, 'Media file missing.');
	}

	return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, {
		headers: {
			'content-type': image.mimeType,
			'cache-control': 'private, max-age=3600'
		}
	});
};
