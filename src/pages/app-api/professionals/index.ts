import type { APIRoute } from 'astro';
import { getProfessionalsCatalog } from '../../../lib/pocketbase';

export const prerender = false;

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

export const GET: APIRoute = async ({ url }) => {
	try {
		const specialite = url.searchParams.get('specialite') ?? undefined;
		const result = await getProfessionalsCatalog(specialite);

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: parseErrorMessage(error) || 'Impossible de charger les professionnels.',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};
