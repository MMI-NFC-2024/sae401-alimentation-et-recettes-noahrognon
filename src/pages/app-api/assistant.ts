import type { APIRoute } from 'astro';
import { analyzePlateFromImage, generateAssistantReply } from '../../lib/assistant';
import { createRecipeFromAssistant, getAssistantWorkspace, saveAssistantConversationTurn } from '../../lib/pocketbase';

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
		const parsed = JSON.parse(error.message) as { message?: string; details?: Record<string, any> };
		if (parsed.details && typeof parsed.details === 'object' && Object.keys(parsed.details).length) {
			const flatDetails = Object.entries(parsed.details)
				.map(([key, value]) => {
					if (value && typeof value === 'object' && 'message' in value) {
						return `${key}: ${String((value as { message?: string }).message ?? '')}`;
					}
					return `${key}: ${String(value ?? '')}`;
				})
				.filter(Boolean)
				.join(' | ');
			if (flatDetails) {
				return `${parsed.message ?? 'Erreur de validation.'} ${flatDetails}`.trim();
			}
		}
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
		const action = String(body.action ?? '').trim();

		if (action === 'save_recipe') {
			const draft = body.draft;
			if (!draft || typeof draft !== 'object') {
				throw new Error('Draft recette manquant.');
			}

			const saved = await createRecipeFromAssistant(userToken, draft);
			return new Response(
				JSON.stringify(saved),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		if (action === 'analyze_plate') {
			const imageDataUrl = String(body.imageDataUrl ?? '').trim();
			if (!imageDataUrl) {
				throw new Error("L'image de l'assiette est requise.");
			}

			const analysis = await analyzePlateFromImage(imageDataUrl);
			return new Response(
				JSON.stringify({ analysis }),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

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
				recipeDraft: reply.recipeDraft ?? null,
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
