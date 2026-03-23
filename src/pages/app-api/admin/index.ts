import type { APIRoute } from 'astro';
import {
	createAdminFood,
	createAdminRecipe,
	deleteAdminComment,
	deleteAdminFood,
	deleteAdminPost,
	getAdminBackoffice,
	updateAdminCommentModeration,
	updateAdminFoodValidation,
	updateAdminPostModeration,
	updateAdminProfessionalApproval,
	toggleAdminProfessionalActive,
	toggleAdminRecipePublish,
	updateAdminRecipeValidation,
	updateAdminUserRole,
} from '../../../lib/pocketbase';

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
		message.includes('not authenticated') ||
		message.includes('unauthorized') ||
		message.includes('failed to authenticate') ||
		(message.includes('invalid') && message.includes('token'))
	);
}

export const GET: APIRoute = async ({ request }) => {
	try {
		const adminToken = getBearerToken(request);
		if (!adminToken) {
			throw new Error('Session admin manquante.');
		}

		const payload = await getAdminBackoffice(adminToken);
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({ message: parseErrorMessage(error) || 'Impossible de charger le back-office.' }),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const adminToken = getBearerToken(request);
		if (!adminToken) {
			throw new Error('Session admin manquante.');
		}

		const body = await request.json();
		const action = String(body.action ?? '');
		let payload;

		if (action === 'add_recipe') {
			payload = await createAdminRecipe(adminToken, {
				title: String(body.title ?? ''),
				description: String(body.description ?? ''),
				goalId: String(body.goalId ?? ''),
				timeMinutes: Number(body.timeMinutes ?? 20),
				portions: Number(body.portions ?? 2),
				calories: Number(body.calories ?? 0),
				proteins: Number(body.proteins ?? 0),
				carbs: Number(body.carbs ?? 0),
				fats: Number(body.fats ?? 0),
				fibers: Number(body.fibers ?? 0),
				difficulty: String(body.difficulty ?? 'facile'),
				ingredientsText: String(body.ingredientsText ?? ''),
				stepsText: String(body.stepsText ?? ''),
				published: Boolean(body.published),
				validationStatus: String(body.validationStatus ?? 'approved'),
				imageDataUrl: String(body.imageDataUrl ?? ''),
			});
		} else if (action === 'add_food') {
			payload = await createAdminFood(adminToken, {
				name: String(body.name ?? ''),
				category: String(body.category ?? 'autre'),
				description: String(body.description ?? ''),
				calories: Number(body.calories ?? 0),
				proteins: Number(body.proteins ?? 0),
				carbs: Number(body.carbs ?? 0),
				fats: Number(body.fats ?? 0),
				fibers: Number(body.fibers ?? 0),
				unit: String(body.unit ?? 'g'),
				validationStatus: String(body.validationStatus ?? 'approved'),
				imageDataUrl: String(body.imageDataUrl ?? ''),
			});
		} else {
			throw new Error('Action admin invalide.');
		}

		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({ message: parseErrorMessage(error) || 'Impossible de créer cet élément.' }),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

export const PATCH: APIRoute = async ({ request }) => {
	try {
		const adminToken = getBearerToken(request);
		if (!adminToken) {
			throw new Error('Session admin manquante.');
		}

		const body = await request.json();
		const action = String(body.action ?? '');
		let payload;

		if (action === 'user_role') {
			payload = await updateAdminUserRole(adminToken, String(body.userId ?? ''), String(body.role ?? 'user'));
		} else if (action === 'recipe_publish') {
			payload = await toggleAdminRecipePublish(adminToken, String(body.recipeId ?? ''), Boolean(body.published));
		} else if (action === 'recipe_validation') {
			payload = await updateAdminRecipeValidation(adminToken, String(body.recipeId ?? ''), String(body.validationStatus ?? 'pending'));
		} else if (action === 'professional_active') {
			payload = await toggleAdminProfessionalActive(adminToken, String(body.professionalId ?? ''), Boolean(body.isActive));
		} else if (action === 'professional_approval') {
			payload = await updateAdminProfessionalApproval(
				adminToken,
				String(body.professionalId ?? ''),
				String(body.approvalStatus ?? 'pending'),
			);
		} else if (action === 'food_validation') {
			payload = await updateAdminFoodValidation(adminToken, String(body.foodId ?? ''), String(body.validationStatus ?? 'pending'));
		} else if (action === 'post_moderation') {
			payload = await updateAdminPostModeration(adminToken, String(body.postId ?? ''), String(body.moderationStatus ?? 'visible'));
		} else if (action === 'comment_moderation') {
			payload = await updateAdminCommentModeration(
				adminToken,
				String(body.commentId ?? ''),
				String(body.moderationStatus ?? 'visible'),
			);
		} else {
			throw new Error('Action admin invalide.');
		}

		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({ message: parseErrorMessage(error) || 'Impossible de mettre à jour le back-office.' }),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

export const DELETE: APIRoute = async ({ request }) => {
	try {
		const adminToken = getBearerToken(request);
		if (!adminToken) {
			throw new Error('Session admin manquante.');
		}

		const body = await request.json();
		const action = String(body.action ?? '');
		let payload;

		if (action === 'food') {
			payload = await deleteAdminFood(adminToken, String(body.foodId ?? ''));
		} else if (action === 'post') {
			payload = await deleteAdminPost(adminToken, String(body.postId ?? ''));
		} else if (action === 'comment') {
			payload = await deleteAdminComment(adminToken, String(body.commentId ?? ''));
		} else {
			throw new Error('Action admin invalide.');
		}

		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({ message: parseErrorMessage(error) || 'Impossible de supprimer cet élément.' }),
			{
				status: isUnauthorizedError(error) ? 401 : 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};
