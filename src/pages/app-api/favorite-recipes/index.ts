import type { APIRoute } from 'astro';
import { getFavoriteRecipesForUser, toggleFavoriteRecipe } from '../../../lib/pocketbase';

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

export const GET: APIRoute = async ({ request }) => {
	try {
		const userToken = getBearerToken(request);
		if (!userToken) {
			throw new Error('Session utilisateur manquante.');
		}

		const result = await getFavoriteRecipesForUser(userToken);
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error) || 'Impossible de charger les favoris.',
			}),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
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

		const body = await request.json();
		const recipeId = String(body.recipeId ?? '').trim();
		if (!recipeId) {
			throw new Error('Recette favorite manquante.');
		}

		const result = await toggleFavoriteRecipe(userToken, recipeId);
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error) || 'Impossible de mettre à jour les favoris.',
			}),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};
