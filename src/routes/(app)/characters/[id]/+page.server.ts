import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { renderMarkdown } from '$lib/server/markdown';
import { getCharacterDetailForUser } from '$lib/server/dreamforge/queries';

export const load: PageServerLoad = ({ locals, params }) => {
	const detail = getCharacterDetailForUser(locals.user!.id, params.id);

	if (!detail) {
		throw error(404, 'Character not found.');
	}

	return {
		...detail,
		bioHtml: renderMarkdown(detail.character.bioMarkdown)
	};
};
