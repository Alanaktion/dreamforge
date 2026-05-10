import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	DreamForgeError,
	updateUniverse,
	updateUniverseTraits
} from '$lib/server/dreamforge/mutations';
import { parseTraitDefinitionsJson, requireString } from '$lib/server/dreamforge/forms';
import { getUniverseWithTraitsForUser } from '$lib/server/dreamforge/queries';

export const load: PageServerLoad = ({ locals, params }) => {
	const detail = getUniverseWithTraitsForUser(locals.user!.id, params.id);

	if (!detail) {
		throw error(404, 'Universe not found.');
	}

	return detail;
};

export const actions: Actions = {
	updateInfo: async ({ locals, params, request }) => {
		const formData = await request.formData();

		try {
			updateUniverse(locals.user!.id, params.id, {
				name: requireString(formData, 'name', 'Universe name'),
				summary: formData.get('summary')?.toString() ?? ''
			});

			return { action: 'updateInfo', success: true };
		} catch (err) {
			if (err instanceof DreamForgeError) {
				return fail(err.status, {
					action: 'updateInfo',
					success: false,
					message: err.message,
					values: {
						name: formData.get('name')?.toString() ?? '',
						summary: formData.get('summary')?.toString() ?? ''
					}
				});
			}

			throw err;
		}
	},

	updateTraits: async ({ locals, params, request }) => {
		const formData = await request.formData();
		const raw = formData.get('traitDefinitions')?.toString() ?? '';

		try {
			const definitions = parseTraitDefinitionsJson(raw);
			updateUniverseTraits(locals.user!.id, params.id, definitions);

			return { action: 'updateTraits', success: true };
		} catch (err) {
			if (err instanceof DreamForgeError) {
				return fail(err.status, {
					action: 'updateTraits',
					success: false,
					message: err.message,
					values: { traitDefinitions: raw }
				});
			}

			throw err;
		}
	}
};
