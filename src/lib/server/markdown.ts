import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

marked.setOptions({
	breaks: true,
	gfm: true
});

export function renderMarkdown(markdown: string): string {
	const rawHtml = marked.parse(markdown) as string;

	return sanitizeHtml(rawHtml, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'img']),
		allowedAttributes: {
			...sanitizeHtml.defaults.allowedAttributes,
			a: ['href', 'name', 'target', 'rel'],
			img: ['src', 'alt', 'title']
		},
		transformTags: {
			a: sanitizeHtml.simpleTransform('a', {
				target: '_blank',
				rel: 'noreferrer noopener'
			})
		}
	});
}
