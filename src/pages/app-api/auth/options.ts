import type { APIRoute } from 'astro';
import { getRegistrationOptions } from '../../../lib/pocketbase';

export const prerender = false;

export const GET: APIRoute = async () => {
	try {
		const options = await getRegistrationOptions();

		return new Response(JSON.stringify(options), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: error instanceof Error ? error.message : 'Impossible de charger les options.',
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
};
