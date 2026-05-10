import type { PageServerLoad } from './$types';
import {
	getCharactersForUser,
	getGalleryImagesForUser,
	getUniversesForUser
} from '$lib/server/dreamforge/queries';

export const load: PageServerLoad = ({ locals }) => ({
	images: getGalleryImagesForUser(locals.user!.id),
	characters: getCharactersForUser(locals.user!.id),
	universes: getUniversesForUser(locals.user!.id)
});
