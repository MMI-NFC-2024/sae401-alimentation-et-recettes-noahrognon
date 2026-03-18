import type { APIRoute } from 'astro';
import {
	authenticatePocketBaseAdmin,
	authenticateUser,
	createNutritionProfile,
	createUserRecord,
	ensureReferenceData,
	findRecordByField,
} from '../../../lib/pocketbase';
import { calculateNutritionTargets } from '../../../lib/nutrition';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');
		const passwordConfirm = String(formData.get('passwordConfirm') ?? '');
		const prenom = String(formData.get('prenom') ?? '');
		const nom = String(formData.get('nom') ?? '');
		const telephone = String(formData.get('telephone') ?? '');
		const age = Number(formData.get('age') ?? 0);
		const sexe = String(formData.get('sexe') ?? '');
		const tailleCm = Number(formData.get('taille_cm') ?? 0);
		const poidsActuelKg = Number(formData.get('poids_actuel_kg') ?? 0);
		const poidsObjectifKg = Number(formData.get('poids_objectif_kg') ?? poidsActuelKg);
		const goalSlug = String(formData.get('objectif_slug') ?? '');
		const activityLevelLabel = String(formData.get('niveau_activite_libelle') ?? '');
		const activityTypeSlug = String(formData.get('type_activite_slug') ?? '');
		const seancesParSemaine = Number(formData.get('seances_par_semaine') ?? 0);
		const dietSlug = String(formData.get('regime_slug') ?? '');
		const restrictionsText = String(formData.get('restrictions_text') ?? '');
		const avatar = formData.get('avatar');

		if (!email || !password || !passwordConfirm || !prenom || !nom) {
			throw new Error('Les informations de contact sont incomplètes.');
		}

		const adminToken = await authenticatePocketBaseAdmin();
		await ensureReferenceData(adminToken);

		const [goal, activityLevel, activityType, diet] = await Promise.all([
			findRecordByField('objectifs', 'slug', goalSlug, adminToken),
			findRecordByField('niveaux_activite', 'libelle', activityLevelLabel, adminToken),
			findRecordByField('types_activite_sportive', 'slug', activityTypeSlug, adminToken),
			findRecordByField('regimes_alimentaires', 'slug', dietSlug, adminToken),
		]);

		if (!goal || !activityLevel || !activityType || !diet) {
			throw new Error('Les références PocketBase requises pour l’onboarding sont introuvables.');
		}

		const nutrition = calculateNutritionTargets({
			age,
			sex: sexe,
			heightCm: tailleCm,
			weightKg: poidsActuelKg,
			goalSlug,
			activityCoefficient: Number(activityLevel.coefficient ?? 1.55),
		});

		const userFormData = new FormData();
		userFormData.set('email', email);
		userFormData.set('password', password);
		userFormData.set('passwordConfirm', passwordConfirm);
		userFormData.set('emailVisibility', 'true');
		userFormData.set('verified', 'false');
		userFormData.set('prenom', prenom);
		userFormData.set('nom', nom);
		userFormData.set('name', `${prenom} ${nom}`.trim());
		userFormData.set('telephone', telephone);
		userFormData.set('age', String(age));
		userFormData.set('sexe', sexe);
		userFormData.set('taille_cm', String(tailleCm));
		userFormData.set('poids_actuel_kg', String(poidsActuelKg));
		userFormData.set('poids_objectif_kg', String(poidsObjectifKg));
		userFormData.set('objectif_id', goal.id);
		userFormData.set('niveau_activite_id', activityLevel.id);
		userFormData.set('type_activite_id', activityType.id);
		userFormData.set('seances_par_semaine', String(seancesParSemaine));
		userFormData.set('regime_id', diet.id);
		userFormData.set('restrictions_text', restrictionsText);
		userFormData.set('date_inscription', new Date().toISOString());
		userFormData.set('onboarding_etape', '7');
		userFormData.set('onboarding_complete', 'true');

		if (avatar instanceof File && avatar.size > 0) {
			userFormData.set('avatar', avatar);
		}

		const createdUser = (await createUserRecord(userFormData, adminToken)) as { id: string };

		await createNutritionProfile(
			{
				user_id: createdUser.id,
				calories_journalieres: nutrition.calories,
				proteines_journalieres_g: nutrition.proteins,
				glucides_journaliers_g: nutrition.carbs,
				lipides_journaliers_g: nutrition.fats,
				imc: nutrition.bmi,
				date_calcul: new Date().toISOString(),
			},
			adminToken,
		);

		const authResult = await authenticateUser(email, password);

		return new Response(
			JSON.stringify({
				...authResult,
				nutrition,
				summary: {
					goal: goal.libelle,
					activityLevel: activityLevel.libelle,
					diet: diet.libelle,
					activityType: activityType.libelle,
				},
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
				message: error instanceof Error ? error.message : 'Inscription impossible.',
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
