import type { PageServerLoad } from './$types';
import { getCharactersForUser } from '$lib/server/dreamforge/queries';

export const load: PageServerLoad = ({ locals }) => ({
	characters: getCharactersForUser(locals.user!.id)
});
