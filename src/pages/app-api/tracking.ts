import type { APIRoute } from 'astro';
import { addTrackingEntry, getTrackingDashboard, removeTrackingEntry } from '../../lib/pocketbase';

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

export const GET: APIRoute = async ({ request, url }) => {
	try {
		const userToken = getBearerToken(request);
		if (!userToken) {
			throw new Error('Session utilisateur manquante.');
		}

		const date = url.searchParams.get('date') ?? undefined;
		const result = await getTrackingDashboard(userToken, date);

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error) || 'Impossible de charger le suivi.',
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

		const body = await request.json();
		const result = await addTrackingEntry(userToken, {
			date: String(body.date),
			typeRepas: String(body.typeRepas),
			sourceType: body.sourceType === 'food' ? 'food' : 'recipe',
			sourceId: String(body.sourceId),
			quantity: Number(body.quantity),
		});

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error) || 'Impossible d’ajouter la consommation.',
			}),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

export const DELETE: APIRoute = async ({ request }) => {
	try {
		const userToken = getBearerToken(request);
		if (!userToken) {
			throw new Error('Session utilisateur manquante.');
		}

		const body = await request.json();
		const result = await removeTrackingEntry(userToken, {
			date: String(body.date),
			sourceType: body.sourceType === 'food' ? 'food' : 'recipe',
			entryId: String(body.entryId),
		});

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error) || 'Impossible de supprimer la consommation.',
			}),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};
