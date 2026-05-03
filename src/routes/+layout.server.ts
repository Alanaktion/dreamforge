import type { LayoutServerLoad } from './$types';
import { getUniverseCountForUser } from '$lib/server/dreamforge/queries';

export const load: LayoutServerLoad = ({ locals }) => {
	const user = locals.user ?? null;
	const universeCount = user ? getUniverseCountForUser(user.id) : 0;

	return {
		user,
		universeCount,
		hasUniverse: universeCount > 0
	};
};
