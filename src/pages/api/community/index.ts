import type { APIRoute } from 'astro';
import { createCommunityPost, getCommunityFeed } from '../../../lib/pocketbase';

export const prerender = false;

function getBearerToken(request: Request) {
	const authHeader = request.headers.get('Authorization') ?? '';
	const match = authHeader.match(/^Bearer\s+(.+)$/i);
	return match?.[1] ?? '';
}

function parseErrorMessage(error: unknown) {
	if (!(error instanceof Error)) {
		return 'Une erreur inattendue est survenue.';
	}

	try {
		const parsed = JSON.parse(error.message) as { message?: string };
		return parsed.message ?? error.message;
	} catch {
		return error.message;
	}
}

function isUnauthorizedError(error: unknown) {
	const message = parseErrorMessage(error).toLowerCase();
	return (
		message.includes('session utilisateur manquante') ||
		message.includes('not authenticated') ||
		message.includes('unauthorized') ||
		message.includes('auth refresh') ||
		message.includes('failed to authenticate') ||
		(message.includes('invalid') && message.includes('token'))
	);
}

function getSortMode(value: string | null) {
	return value === 'popular' ? 'popular' : 'recent';
}

export const GET: APIRoute = async ({ request, url }) => {
	try {
		const userToken = getBearerToken(request);
		if (!userToken) {
			throw new Error('Session utilisateur manquante.');
		}

		const result = await getCommunityFeed(userToken, getSortMode(url.searchParams.get('sort')));
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error) || 'Impossible de charger la communauté.',
			}),
			{
				status: isUnauthorizedError(error) ? 401 : 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const userToken = getBearerToken(request);
		if (!userToken) {
			throw new Error('Session utilisateur manquante.');
		}

		const formData = await request.formData();
		const image = formData.get('image');
		const result = await createCommunityPost(userToken, {
			description: String(formData.get('description') ?? ''),
			hashtags: String(formData.get('hashtags') ?? ''),
			image: image instanceof File ? image : null,
			imageDataUrl: String(formData.get('imageDataUrl') ?? ''),
			recipeId: String(formData.get('recipeId') ?? ''),
			sortMode: getSortMode(String(formData.get('sort') ?? 'recent')),
		});

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error) || 'Impossible de publier ce post.',
			}),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};
