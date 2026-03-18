import type { APIRoute } from 'astro';
import { addCommunityComment } from '../../../lib/pocketbase';

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

export const POST: APIRoute = async ({ request }) => {
	try {
		const userToken = getBearerToken(request);
		if (!userToken) {
			throw new Error('Session utilisateur manquante.');
		}

		const body = await request.json();
		const result = await addCommunityComment(userToken, {
			postId: String(body.postId ?? ''),
			commentaire: String(body.commentaire ?? ''),
			sortMode: body.sort === 'popular' ? 'popular' : 'recent',
		});

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error) || 'Impossible d’ajouter ce commentaire.',
			}),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};
