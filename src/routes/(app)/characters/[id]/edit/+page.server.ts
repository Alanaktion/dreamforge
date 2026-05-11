import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DreamForgeError, updateCharacter } from '$lib/server/dreamforge/mutations';
import { parseTraitValuesFromFormData, requireString } from '$lib/server/dreamforge/forms';
import {
	getCharacterDetailForUser,
	getUniverseWithTraitsForUser
} from '$lib/server/dreamforge/queries';

export const load: PageServerLoad = ({ locals, params }) => {
	const detail = getCharacterDetailForUser(locals.user!.id, params.id);

	if (!detail) {
		throw error(404, 'Character not found.');
	}

	const universeData = getUniverseWithTraitsForUser(locals.user!.id, detail.character.universeId);

	return {
		character: detail.character,
		traitValues: detail.traitValues,
		traitDefinitions: universeData?.traitDefinitions ?? []
	};
};

export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		const formData = await request.formData();
		const traitKeys = (
			getCharacterDetailForUser(locals.user!.id, params.id)?.traitValues ?? []
		).map((t) => t.key);

		function collectTraitValues() {
			return Object.fromEntries(
				traitKeys.map((key) => [key, formData.get(`trait:${key}`)?.toString().trim() ?? ''])
			);
		}

		try {
			updateCharacter(locals.user!.id, params.id, {
				universeId: '',
				name: requireString(formData, 'name', 'Character name'),
				summary: formData.get('summary')?.toString() ?? '',
				bioMarkdown: formData.get('bioMarkdown')?.toString() ?? '',
				traitValues: parseTraitValuesFromFormData(formData, traitKeys)
			});

			throw redirect(303, `/characters/${params.id}`);
		} catch (err) {
			if (err instanceof DreamForgeError) {
				return fail(err.status, {
					message: err.message,
					values: {
						name: formData.get('name')?.toString() ?? '',
						summary: formData.get('summary')?.toString() ?? '',
						bioMarkdown: formData.get('bioMarkdown')?.toString() ?? '',
						traits: collectTraitValues()
					}
				});
			}

			throw err;
		}
	}
};
