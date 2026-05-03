import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { getUniverseCountForUser } from '$lib/server/dreamforge/queries';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		return {};
	}

	const universeCount = getUniverseCountForUser(locals.user.id);
	throw redirect(302, universeCount > 0 ? '/characters' : '/onboarding/universe');
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString() ?? '';
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		try {
			await auth.api.signUpEmail({
				body: {
					name,
					email,
					password
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					message: error.message || 'Registration failed.',
					name,
					email
				});
			}

			return fail(500, { message: 'Unexpected registration error.', name, email });
		}

		throw redirect(303, '/onboarding/universe');
	}
};
