import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DreamForgeError, createCharacter } from '$lib/server/dreamforge/mutations';
import { parseTraitValuesJson, requireString } from '$lib/server/dreamforge/forms';
import { getUniversesWithTraitsForUser } from '$lib/server/dreamforge/queries';

export const load: PageServerLoad = ({ locals, url }) => {
	const universes = getUniversesWithTraitsForUser(locals.user!.id);

	if (!universes.length) {
		throw redirect(302, '/onboarding/universe');
	}

	return {
		universes,
		selectedUniverseId: url.searchParams.get('universe') ?? universes[0].id,
		traitTemplate: JSON.stringify(
			Object.fromEntries(universes[0].traitDefinitions.map((definition) => [definition.key, ''])),
			null,
			2
		)
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const formData = await request.formData();

		try {
			const characterId = createCharacter(locals.user!.id, {
				universeId: requireString(formData, 'universeId', 'Universe'),
				name: requireString(formData, 'name', 'Character name'),
				summary: formData.get('summary')?.toString() ?? '',
				bioMarkdown: formData.get('bioMarkdown')?.toString() ?? '',
				traitValues: parseTraitValuesJson(formData.get('traitValues')?.toString() ?? '')
			});

			throw redirect(303, `/characters/${characterId}`);
		} catch (error) {
			if (error instanceof DreamForgeError) {
				return fail(error.status, {
					message: error.message,
					values: {
						universeId: formData.get('universeId')?.toString() ?? '',
						name: formData.get('name')?.toString() ?? '',
						summary: formData.get('summary')?.toString() ?? '',
						bioMarkdown: formData.get('bioMarkdown')?.toString() ?? '',
						traitValues: formData.get('traitValues')?.toString() ?? '{}'
					}
				});
			}

			throw error;
		}
	}
};
