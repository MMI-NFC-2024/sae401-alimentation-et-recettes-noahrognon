import type { APIRoute } from 'astro';
import { scanFoodProductFromImage } from '../../../lib/assistant';
import { createFoodFromScan } from '../../../lib/pocketbase';

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
		const mode = String(body.mode ?? 'analyze');

		if (mode === 'analyze') {
			const imageDataUrl = String(body.imageDataUrl ?? '').trim();
			if (!imageDataUrl) {
				throw new Error("L'image du produit est requise.");
			}

			const scan = await scanFoodProductFromImage(imageDataUrl);
			return new Response(
				JSON.stringify({
					scan,
					assistantMessage: `J'ai analysé ce produit. Vérifiez les valeurs puis enregistrez-le dans votre base d'aliments.`,
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		if (mode === 'save') {
			const scan = body.scan ?? {};
			const result = await createFoodFromScan(userToken, {
				imageDataUrl: String(body.imageDataUrl ?? '').trim() || undefined,
				nom: String(scan.nom ?? '').trim(),
				marque: String(scan.marque ?? '').trim(),
				categorie: String(scan.categorie ?? 'autre'),
				description: String(scan.description ?? '').trim(),
				uniteParDefaut: String(scan.uniteParDefaut ?? 'g'),
				calories100g: Number(scan.calories100g ?? 0),
				proteines100g: Number(scan.proteines100g ?? 0),
				glucides100g: Number(scan.glucides100g ?? 0),
				lipides100g: Number(scan.lipides100g ?? 0),
				fibres100g: Number(scan.fibres100g ?? 0),
			});

			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		throw new Error('Mode de scan invalide.');
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error),
			}),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};
