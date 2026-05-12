import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchCharactersByName } from '$lib/server/dreamforge/queries';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		throw error(401, 'Authentication required.');
	}

	const q = url.searchParams.get('q')?.trim() ?? '';
	if (!q) {
		return json([]);
	}

	const results = searchCharactersByName(locals.user.id, q);
	return json(results);
};
