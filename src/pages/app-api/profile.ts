import type { APIRoute } from 'astro';
import {
	authenticatePocketBaseAdmin,
	findRecordByField,
	getFileUrl,
	getNutritionProfileByUserId,
	getUserRecordById,
	refreshUserAuth,
	updateUserRecordById,
	upsertNutritionProfile,
} from '../../lib/pocketbase';
import { calculateNutritionTargets } from '../../lib/nutrition';

export const prerender = false;

function getBearerToken(request: Request) {
	const authHeader = request.headers.get('Authorization') ?? '';
	const match = authHeader.match(/^Bearer\s+(.+)$/i);
	return match?.[1] ?? '';
}

export const GET: APIRoute = async ({ request }) => {
	try {
		const userToken = getBearerToken(request);
		if (!userToken) {
			throw new Error('Session utilisateur manquante.');
		}

		const auth = await refreshUserAuth(userToken);
		const adminToken = await authenticatePocketBaseAdmin();
		const user = await getUserRecordById(auth.record.id, adminToken);
		const nutritionProfile = await getNutritionProfileByUserId(auth.record.id, adminToken);
		const avatarUrl = await getFileUrl('users', user.id, user.avatar);

		return new Response(
			JSON.stringify({
				token: auth.token,
				user: {
					...user,
					avatarUrl,
				},
				nutritionProfile,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: error instanceof Error ? error.message : 'Impossible de charger le profil.',
			}),
			{
				status: 401,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
};

export const PATCH: APIRoute = async ({ request }) => {
	try {
		const userToken = getBearerToken(request);
		if (!userToken) {
			throw new Error('Session utilisateur manquante.');
		}

		const auth = await refreshUserAuth(userToken);
		const adminToken = await authenticatePocketBaseAdmin();
		const body = await request.json();

		const goal = body.objectif_slug
			? await findRecordByField('objectifs', 'slug', String(body.objectif_slug), adminToken)
			: null;
		const activityLevel = body.niveau_activite_libelle
			? await findRecordByField('niveaux_activite', 'libelle', String(body.niveau_activite_libelle), adminToken)
			: null;
		const activityType = body.type_activite_slug
			? await findRecordByField('types_activite_sportive', 'slug', String(body.type_activite_slug), adminToken)
			: null;
		const diet = body.regime_slug
			? await findRecordByField('regimes_alimentaires', 'slug', String(body.regime_slug), adminToken)
			: null;

		const patchData: Record<string, unknown> = {
			prenom: body.prenom,
			nom: body.nom,
			name: `${body.prenom ?? auth.record.prenom ?? ''} ${body.nom ?? auth.record.nom ?? ''}`.trim(),
			telephone: body.telephone,
			age: Number(body.age),
			sexe: body.sexe,
			taille_cm: Number(body.taille_cm),
			poids_actuel_kg: Number(body.poids_actuel_kg),
			poids_objectif_kg: Number(body.poids_objectif_kg),
			seances_par_semaine: Number(body.seances_par_semaine),
			restrictions_text: body.restrictions_text ?? '',
		};

		if (goal) patchData.objectif_id = goal.id;
		if (activityLevel) patchData.niveau_activite_id = activityLevel.id;
		if (activityType) patchData.type_activite_id = activityType.id;
		if (diet) patchData.regime_id = diet.id;

		await updateUserRecordById(auth.record.id, patchData, adminToken);

		const nutrition = calculateNutritionTargets({
			age: Number(body.age),
			sex: String(body.sexe),
			heightCm: Number(body.taille_cm),
			weightKg: Number(body.poids_actuel_kg),
			goalSlug: String(body.objectif_slug || 'maintien'),
			activityCoefficient: Number(activityLevel?.coefficient ?? 1.55),
		});

		await upsertNutritionProfile(
			auth.record.id,
			{
				calories_journalieres: nutrition.calories,
				proteines_journalieres_g: nutrition.proteins,
				glucides_journaliers_g: nutrition.carbs,
				lipides_journaliers_g: nutrition.fats,
				imc: nutrition.bmi,
				date_calcul: new Date().toISOString(),
			},
			adminToken,
		);

		const refreshedAuth = await refreshUserAuth(auth.token);
		const user = await getUserRecordById(refreshedAuth.record.id, adminToken);
		const nutritionProfile = await getNutritionProfileByUserId(refreshedAuth.record.id, adminToken);
		const avatarUrl = await getFileUrl('users', user.id, user.avatar);

		return new Response(
			JSON.stringify({
				token: refreshedAuth.token,
				user: {
					...user,
					avatarUrl,
				},
				nutritionProfile,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				message: error instanceof Error ? error.message : 'Impossible de mettre à jour le profil.',
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
