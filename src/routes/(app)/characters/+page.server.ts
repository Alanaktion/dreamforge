import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getCharactersForUser, getUniversesForUser } from '$lib/server/dreamforge/queries';
import {
	createCharacter,
	DreamForgeError,
	updateCharacterBasic
} from '$lib/server/dreamforge/mutations';

export const load: PageServerLoad = ({ locals }) => ({
	characters: getCharactersForUser(locals.user!.id),
	universes: getUniversesForUser(locals.user!.id)
});

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const formData = await request.formData();
		const universeId = formData.get('universeId')?.toString().trim() ?? '';
		const name = formData.get('name')?.toString().trim() ?? '';
		const summary = formData.get('summary')?.toString().trim() ?? '';

		try {
			if (!universeId) throw new DreamForgeError('Universe is required.');
			if (!name) throw new DreamForgeError('Character name is required.');

			createCharacter(locals.user!.id, { universeId, name, summary });
			return { action: 'create' as const, success: true };
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

		try {
			if (!characterId) throw new DreamForgeError('Character ID is required.');

			updateCharacterBasic(locals.user!.id, characterId, { name, summary });
			return { action: 'update' as const, success: true, characterId };
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
