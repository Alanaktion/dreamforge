import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DreamForgeError, createUniverse } from '$lib/server/dreamforge/mutations';
import { parseTraitDefinitionsJson, requireString } from '$lib/server/dreamforge/forms';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const formData = await request.formData();

		try {
			const universeId = createUniverse(locals.user.id, {
				name: requireString(formData, 'name', 'Universe name'),
				summary: formData.get('summary')?.toString() ?? '',
				traitDefinitions: parseTraitDefinitionsJson(
					formData.get('traitDefinitions')?.toString() ?? ''
				)
			});

			throw redirect(303, `/universes/${universeId}`);
		} catch (error) {
			if (error instanceof DreamForgeError) {
				return fail(error.status, {
					message: error.message,
					values: {
						name: formData.get('name')?.toString() ?? '',
						summary: formData.get('summary')?.toString() ?? '',
						traitDefinitions: formData.get('traitDefinitions')?.toString() ?? '[]'
					}
				});
			}

			throw error;
		}
	}
};
