import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getUniverseCountForUser } from '$lib/server/dreamforge/queries';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const universeCount = getUniverseCountForUser(locals.user.id);
	const isOnboardingRoute = url.pathname.startsWith('/onboarding');

	if (universeCount === 0 && !isOnboardingRoute) {
		throw redirect(302, '/onboarding/universe');
	}

	if (universeCount > 0 && isOnboardingRoute) {
		throw redirect(302, '/characters');
	}

	return {
		user: locals.user,
		universeCount
	};
};
