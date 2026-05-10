import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DreamForgeError, createCharacter } from '$lib/server/dreamforge/mutations';
import { parseTraitValuesFromFormData, requireString } from '$lib/server/dreamforge/forms';
import {
	getUniverseWithTraitsForUser,
	getUniversesWithTraitsForUser
} from '$lib/server/dreamforge/queries';

export const load: PageServerLoad = ({ locals, url }) => {
	const universes = getUniversesWithTraitsForUser(locals.user!.id);

	if (!universes.length) {
		throw redirect(302, '/onboarding/universe');
	}

	return {
		universes,
		selectedUniverseId: url.searchParams.get('universe') ?? universes[0].id
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const formData = await request.formData();
		const universeId = formData.get('universeId')?.toString().trim() ?? '';

		const universeData = universeId
			? getUniverseWithTraitsForUser(locals.user!.id, universeId)
			: null;
		const traitKeys = (universeData?.traitDefinitions ?? []).map((d) => d.key);

		function collectTraitValues() {
			return Object.fromEntries(
				traitKeys.map((key) => [key, formData.get(`trait:${key}`)?.toString().trim() ?? ''])
			);
		}

		try {
			if (!universeId) {
				throw new DreamForgeError('Universe is required.');
			}

			const characterId = createCharacter(locals.user!.id, {
				universeId,
				name: requireString(formData, 'name', 'Character name'),
				summary: formData.get('summary')?.toString() ?? '',
				bioMarkdown: formData.get('bioMarkdown')?.toString() ?? '',
				traitValues: parseTraitValuesFromFormData(formData, traitKeys)
			});

			throw redirect(303, `/characters/${characterId}`);
		} catch (error) {
			if (error instanceof DreamForgeError) {
				return fail(error.status, {
					message: error.message,
					values: {
						universeId,
						name: formData.get('name')?.toString() ?? '',
						summary: formData.get('summary')?.toString() ?? '',
						bioMarkdown: formData.get('bioMarkdown')?.toString() ?? '',
						traits: collectTraitValues()
					}
				});
			}

			throw error;
		}
	}
};
