import type { APIRoute } from 'astro';
import { authenticateUser } from '../../../lib/pocketbase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const { email, password } = await request.json();
		const result = await authenticateUser(email, password);

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: error instanceof Error ? error.message : 'Connexion impossible.',
			}),
			{
				status: 400,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
};
