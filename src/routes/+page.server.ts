import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUniverseCountForUser } from '$lib/server/dreamforge/queries';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const universeCount = getUniverseCountForUser(locals.user.id);

	throw redirect(302, universeCount > 0 ? '/characters' : '/onboarding/universe');
};
