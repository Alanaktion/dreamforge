import { extname } from 'node:path';
import { unlink, writeFile } from 'node:fs/promises';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createImage, DreamForgeError } from '$lib/server/dreamforge/mutations';
import { resolveUploadPath } from '$lib/server/storage';
import { storage } from '$lib/server/db';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, 'Authentication required.');
	}

	const formData = await request.formData();
	const file = formData.get('file');

	if (!(file instanceof File) || file.size === 0) {
		return json({ message: 'An image file is required.' }, { status: 400 });
	}

	if (!file.type.startsWith('image/')) {
		return json({ message: 'Only image uploads are supported.' }, { status: 400 });
	}

	const extension = extname(file.name).toLowerCase() || inferExtension(file.type);
	const filename = `${crypto.randomUUID()}${extension}`;
	const filePath = resolveUploadPath(storage, filename);

	await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

	try {
		const imageId = createImage(locals.user.id, {
			filename,
			originalFilename: file.name,
			altText: formData.get('altText')?.toString() ?? '',
			filePath: filename,
			mimeType: file.type,
			characterId: formData.get('characterId')?.toString() || undefined,
			universeId: formData.get('universeId')?.toString() || undefined
		});

		return json(
			{
				imageId,
				filename,
				url: `${storage.uploadsPublicPrefix}/${filename}`
			},
			{ status: 201 }
		);
	} catch (uploadError) {
		await unlink(filePath).catch(() => undefined);

		if (uploadError instanceof DreamForgeError) {
			return json({ message: uploadError.message }, { status: uploadError.status });
		}

		throw uploadError;
	}
};

function inferExtension(mimeType: string): string {
	switch (mimeType) {
		case 'image/jpeg':
			return '.jpg';
		case 'image/png':
			return '.png';
		case 'image/webp':
			return '.webp';
		case 'image/gif':
			return '.gif';
		case 'image/svg+xml':
			return '.svg';
		default:
			return '';
	}
}
