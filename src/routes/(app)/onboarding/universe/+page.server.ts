import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DreamForgeError, createUniverse } from '$lib/server/dreamforge/mutations';
import { parseTraitDefinitionsJson, requireString } from '$lib/server/dreamforge/forms';
import { getUniverseCountForUser } from '$lib/server/dreamforge/queries';

const starterTraitDefinitions = JSON.stringify(
	[
		{ key: 'role', label: 'Role', category: 'personality', valueType: 'text' },
		{ key: 'alignment', label: 'Alignment', category: 'personality', valueType: 'text' },
		{ key: 'origin', label: 'Origin', category: 'history', valueType: 'text' },
		{ key: 'appearance', label: 'Appearance', category: 'appearance', valueType: 'text' }
	],
	null,
	2
);

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (getUniverseCountForUser(locals.user.id) > 0) {
		throw redirect(302, '/characters');
	}

	return {
		starterTraitDefinitions
	};
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

			throw redirect(303, `/characters/create?universe=${universeId}`);
		} catch (error) {
			if (error instanceof DreamForgeError) {
				return fail(error.status, {
					message: error.message,
					values: {
						name: formData.get('name')?.toString() ?? '',
						summary: formData.get('summary')?.toString() ?? '',
						traitDefinitions:
							formData.get('traitDefinitions')?.toString() ?? starterTraitDefinitions
					}
				});
			}

			throw error;
		}
	}
};
