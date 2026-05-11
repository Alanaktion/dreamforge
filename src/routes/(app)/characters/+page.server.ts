import type { PageServerLoad } from './$types';
import { getCharactersForUser } from '$lib/server/dreamforge/queries';

export const load: PageServerLoad = ({ locals }) => {
	const userId = locals.user!.id;
	return {
		characters: getCharactersForUser(userId)
	};
};
