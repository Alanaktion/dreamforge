import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getCharactersForUser,
	getUniversesForUser
} from '$lib/server/dreamforge/queries';
import {
	createCharacter,
	DreamForgeError,
	updateCharacterBasic
} from '$lib/server/dreamforge/mutations';

function collectTraitValues(formData: FormData): Record<string, string> {
	const values: Record<string, string> = {};
	for (const [key, val] of formData.entries()) {
		if (key.startsWith('trait:')) {
			values[key.slice(6)] = val.toString().trim();
		}
	}
	return values;
}

export const load: PageServerLoad = ({ locals }) => {
	const userId = locals.user!.id;
	return {
		universes: getUniversesForUser(userId),
		traitDefinitions: [] as [],
		characters: getCharactersForUser(userId).map((c) => ({
			...c,
			traitValues: {} as Record<string, string>
		}))
	};
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const formData = await request.formData();
		const universeId = formData.get('universeId')?.toString().trim() ?? '';
		const name = formData.get('name')?.toString().trim() ?? '';
		const summary = formData.get('summary')?.toString().trim() ?? '';
		const traitValues = collectTraitValues(formData);

		try {
			if (!universeId) throw new DreamForgeError('Universe is required.');
			if (!name) throw new DreamForgeError('Character name is required.');

			createCharacter(locals.user!.id, {
				universeId,
				name,
				summary,
				traitValues: Object.keys(traitValues).length ? traitValues : undefined
			});
			return { action: 'create' as const, success: true as const };
		} catch (err) {
			if (err instanceof DreamForgeError) {
				return fail(err.status, {
					action: 'create' as const,
					message: err.message,
					values: { universeId, name, summary }
				});
			}
			throw err;
		}
	},

	update: async ({ locals, request }) => {
		const formData = await request.formData();
		const characterId = formData.get('characterId')?.toString().trim() ?? '';
		const name = formData.get('name')?.toString().trim() ?? '';
		const summary = formData.get('summary')?.toString().trim() ?? '';
		const traitValues = collectTraitValues(formData);

		try {
			if (!characterId) throw new DreamForgeError('Character ID is required.');

			updateCharacterBasic(locals.user!.id, characterId, {
				name,
				summary,
				traitValues: Object.keys(traitValues).length ? traitValues : undefined
			});
			return { action: 'update' as const, success: true as const, characterId };
		} catch (err) {
			if (err instanceof DreamForgeError) {
				return fail(err.status, {
					action: 'update' as const,
					message: err.message,
					characterId,
					values: { name, summary }
				});
			}
			throw err;
		}
	}
};
