import type { APIRoute } from 'astro';
import { authenticatePocketBaseSuperuser } from '../../../lib/pocketbase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const result = await authenticatePocketBaseSuperuser(String(body.email ?? ''), String(body.password ?? ''));

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: error instanceof Error ? error.message : 'Connexion admin impossible.',
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};
