import type { PageServerLoad } from './$types';
import { getUniversesWithDetailsForUser } from '$lib/server/dreamforge/queries';

export const load: PageServerLoad = ({ locals }) => {
	return {
		universes: getUniversesWithDetailsForUser(locals.user!.id)
	};
};
