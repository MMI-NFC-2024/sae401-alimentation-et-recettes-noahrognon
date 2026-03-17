import type { APIRoute } from 'astro';
import { generateAssistantReply } from '../../lib/assistant';
import { getAssistantWorkspace, saveAssistantConversationTurn } from '../../lib/pocketbase';

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

		const workspace = await getAssistantWorkspace(userToken);
		return new Response(JSON.stringify(workspace), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error) || "Impossible de charger l'assistant.",
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
		const message = String(body.message ?? '').trim();
		const conversationId = String(body.conversationId ?? '').trim() || undefined;
		if (!message) {
			throw new Error('Le message ne peut pas être vide.');
		}

		const workspace = await getAssistantWorkspace(userToken);
		const reply = await generateAssistantReply(
			userToken,
			workspace.messages.map((item: Record<string, any>) => ({
				role: item.role,
				content: item.content,
			})),
			message,
		);

		const saved = await saveAssistantConversationTurn(userToken, {
			conversationId,
			userMessage: message,
			assistantMessage: reply.answer,
			assistantMetadata: {
				relatedRecipes: reply.relatedRecipes,
				relatedLinks: reply.relatedLinks,
			},
		});

		return new Response(
			JSON.stringify({
				token: saved.token,
				conversation: saved.conversation,
				messages: saved.messages,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error) || "Impossible d'envoyer ce message à l'assistant.",
			}),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};
