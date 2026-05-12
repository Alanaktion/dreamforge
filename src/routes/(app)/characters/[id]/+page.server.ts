import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DreamForgeError, deleteCharacter } from '$lib/server/dreamforge/mutations';
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

export const actions: Actions = {
	delete: async ({ locals, params }) => {
		try {
			deleteCharacter(locals.user!.id, params.id);
		} catch (err) {
			if (err instanceof DreamForgeError) {
				return fail(err.status, {
					message: err.message
				});
			}
			throw err;
		}

		throw redirect(303, '/characters');
	}
};
