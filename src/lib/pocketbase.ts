import { readFile } from 'node:fs/promises';
import path from 'node:path';

type PocketBaseServerConfig = {
	args?: string[];
	env?: Record<string, string>;
};

type PocketBaseConfig = {
	url: string;
	adminEmail: string;
	adminPassword: string;
};

type OptionRecord = {
	id: string;
	libelle: string;
	description?: string;
	slug?: string;
	coefficient?: number;
};

type RecipeTagSeed = {
	libelle: string;
	slug: string;
	couleur: string;
};

type RecipeMetadataSeed = {
	regimeSlugs: string[];
	tagSlugs: string[];
};

const defaultReferenceData = {
	objectifs: [
		{ libelle: 'Perte de poids', description: 'Déficit calorique contrôlé', slug: 'perte-poids' },
		{ libelle: 'Prise de masse', description: 'Surplus calorique avec protéines', slug: 'prise-masse' },
		{ libelle: 'Maintien', description: 'Équilibre énergétique', slug: 'maintien' },
		{ libelle: 'Alimentation équilibrée', description: 'Santé et bien-être', slug: 'equilibre' },
	],
	niveaux_activite: [
		{ libelle: 'Sédentaire', description: 'Peu ou pas d’activité', coefficient: 1.2 },
		{ libelle: 'Léger', description: '1 à 2 entraînements par semaine', coefficient: 1.375 },
		{ libelle: 'Modéré', description: '3 à 4 entraînements par semaine', coefficient: 1.55 },
		{ libelle: 'Intense', description: '5 à 6 entraînements par semaine', coefficient: 1.725 },
		{ libelle: 'Très intense', description: 'Sport quotidien ou travail physique', coefficient: 1.9 },
	],
	types_activite_sportive: [
		{ libelle: 'Cardio', slug: 'cardio' },
		{ libelle: 'Musculation', slug: 'musculation' },
		{ libelle: 'Sport collectif', slug: 'sport-collectif' },
		{ libelle: 'Yoga', slug: 'yoga' },
		{ libelle: 'Crossfit', slug: 'crossfit' },
		{ libelle: 'Autre', slug: 'autre' },
	],
	regimes_alimentaires: [
		{ libelle: 'Végétarien', description: 'Sans viande ni poisson', slug: 'vegetarien' },
		{ libelle: 'Végétalien', description: '100% végétal', slug: 'vegetalien' },
		{ libelle: 'Méditerranéen', description: 'Fruits, légumes, poisson', slug: 'mediterraneen' },
		{ libelle: 'Faible en glucides', description: 'Réduction des sucres', slug: 'faible-glucides' },
		{ libelle: 'Classique', description: 'Alimentation variée', slug: 'classique' },
	],
} as const;

const defaultRecipeTags: RecipeTagSeed[] = [
	{ libelle: 'Riche en protéines', slug: 'riche-proteines', couleur: '#dff8eb' },
	{ libelle: 'Faible en calories', slug: 'faible-calories', couleur: '#def7ec' },
	{ libelle: 'Rapide', slug: 'rapide', couleur: '#edf9e4' },
	{ libelle: 'Riche en fibres', slug: 'riche-fibres', couleur: '#e5f7f1' },
	{ libelle: 'Coloré', slug: 'colore', couleur: '#e6faf3' },
	{ libelle: 'Équilibré', slug: 'equilibre', couleur: '#e8f4ff' },
	{ libelle: 'Faible en glucides', slug: 'faible-glucides', couleur: '#eef7df' },
	{ libelle: 'Énergie', slug: 'energie', couleur: '#fff4de' },
];

const recipeMetadataBySlug: Record<string, RecipeMetadataSeed> = {
	'bowl-quinoa-poulet': { regimeSlugs: ['classique'], tagSlugs: ['riche-proteines'] },
	'saumon-riz-brocoli': { regimeSlugs: ['classique'], tagSlugs: ['equilibre'] },
	'pates-completes-boeuf-tomate': { regimeSlugs: ['classique'], tagSlugs: ['energie'] },
	'omelette-epinards-fromage-blanc': { regimeSlugs: ['faible-glucides'], tagSlugs: ['riche-proteines'] },
	'salade-fraiche-poulet-pomme': { regimeSlugs: ['mediterraneen'], tagSlugs: ['faible-calories'] },
	'porridge-avoine-banane': { regimeSlugs: ['vegetarien'], tagSlugs: ['energie'] },
	'quinoa-legumes-mediterraneens': { regimeSlugs: ['mediterraneen'], tagSlugs: ['riche-fibres'] },
	'bol-yaourt-fraises-amandes': { regimeSlugs: ['vegetarien'], tagSlugs: ['rapide'] },
	'tomates-farcies-boeuf-riz': { regimeSlugs: ['classique'], tagSlugs: ['equilibre'] },
	'saute-de-courgettes-oeufs': { regimeSlugs: ['vegetarien'], tagSlugs: ['faible-glucides'] },
};

let cachedConfig: PocketBaseConfig | null = null;

async function getPocketBaseConfig(): Promise<PocketBaseConfig> {
	if (cachedConfig) {
		return cachedConfig;
	}

	if (
		process.env.POCKETBASE_URL &&
		process.env.POCKETBASE_ADMIN_EMAIL &&
		process.env.POCKETBASE_ADMIN_PASSWORD
	) {
		cachedConfig = {
			url: process.env.POCKETBASE_URL,
			adminEmail: process.env.POCKETBASE_ADMIN_EMAIL,
			adminPassword: process.env.POCKETBASE_ADMIN_PASSWORD,
		};
		return cachedConfig;
	}

	const mcpPath = path.resolve(process.cwd(), '.vscode', 'mcp.json');
	const raw = await readFile(mcpPath, 'utf8');
	const parsed = JSON.parse(raw) as {
		servers?: Record<string, PocketBaseServerConfig>;
	};
	const server = parsed.servers?.['pocketbase-server'];

	if (!server?.env?.POCKETBASE_URL || !server.env.POCKETBASE_ADMIN_EMAIL || !server.env.POCKETBASE_ADMIN_PASSWORD) {
		throw new Error('Configuration PocketBase introuvable dans .vscode/mcp.json');
	}

	cachedConfig = {
		url: server.env.POCKETBASE_URL,
		adminEmail: server.env.POCKETBASE_ADMIN_EMAIL,
		adminPassword: server.env.POCKETBASE_ADMIN_PASSWORD,
	};

	return cachedConfig;
}

async function pbFetch<T>(endpoint: string, init?: RequestInit, token?: string): Promise<T> {
	const config = await getPocketBaseConfig();
	const headers = new Headers(init?.headers);

	if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
		headers.set('Content-Type', 'application/json');
	}

	if (token) {
		headers.set('Authorization', `Bearer ${token}`);
	}

	const response = await fetch(`${config.url}${endpoint}`, {
		...init,
		headers,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || `PocketBase request failed: ${response.status}`);
	}

	const text = await response.text();
	return (text ? JSON.parse(text) : {}) as T;
}

export async function authenticatePocketBaseAdmin(): Promise<string> {
	const config = await getPocketBaseConfig();
	const response = await pbFetch<{ token: string }>(
		'/api/collections/_superusers/auth-with-password',
		{
			method: 'POST',
			body: JSON.stringify({
				identity: config.adminEmail,
				password: config.adminPassword,
			}),
		},
	);

	return response.token;
}

export async function getPocketBaseBaseUrl(): Promise<string> {
	const config = await getPocketBaseConfig();
	return config.url;
}

type AuthRefreshResponse = {
	token: string;
	record: Record<string, any>;
};

async function listRecords<T>(collection: string, token: string): Promise<T[]> {
	const result = await pbFetch<{ items: T[] }>(
		`/api/collections/${collection}/records?perPage=200`,
		undefined,
		token,
	);
	return result.items;
}

async function listRecordsWithQuery<T>(collection: string, query: string, token: string): Promise<T[]> {
	const separator = query.startsWith('?') ? '' : '?';
	const result = await pbFetch<{ items: T[] }>(
		`/api/collections/${collection}/records${separator}${query}`,
		undefined,
		token,
	);
	return result.items;
}

async function createRecord(collection: string, data: Record<string, unknown> | FormData, token: string) {
	return pbFetch(`/api/collections/${collection}/records`, {
		method: 'POST',
		body: data instanceof FormData ? data : JSON.stringify(data),
	}, token);
}

async function updateRecord(
	collection: string,
	recordId: string,
	data: Record<string, unknown> | FormData,
	token: string,
) {
	return pbFetch(`/api/collections/${collection}/records/${recordId}`, {
		method: 'PATCH',
		body: data instanceof FormData ? data : JSON.stringify(data),
	}, token);
}

async function ensureCollectionSeeded(
	collection: keyof typeof defaultReferenceData,
	token: string,
): Promise<void> {
	const items = await listRecords<OptionRecord>(collection, token);
	if (items.length > 0) {
		return;
	}

	for (const item of defaultReferenceData[collection]) {
		await createRecord(collection, item as Record<string, unknown>, token);
	}
}

export async function ensureReferenceData(token: string): Promise<void> {
	await ensureCollectionSeeded('objectifs', token);
	await ensureCollectionSeeded('niveaux_activite', token);
	await ensureCollectionSeeded('types_activite_sportive', token);
	await ensureCollectionSeeded('regimes_alimentaires', token);
}

export async function getRegistrationOptions() {
	const token = await authenticatePocketBaseAdmin();
	await ensureReferenceData(token);

	const [goals, activityLevels, activityTypes, diets] = await Promise.all([
		listRecords<OptionRecord>('objectifs', token),
		listRecords<OptionRecord>('niveaux_activite', token),
		listRecords<OptionRecord>('types_activite_sportive', token),
		listRecords<OptionRecord>('regimes_alimentaires', token),
	]);

	return {
		goals,
		activityLevels,
		activityTypes,
		diets,
	};
}

export async function findRecordByField(
	collection: string,
	field: string,
	value: string,
	token: string,
): Promise<OptionRecord | null> {
	const encoded = encodeURIComponent(`${field}="${value}"`);
	const response = await pbFetch<{ items: OptionRecord[] }>(
		`/api/collections/${collection}/records?perPage=1&filter=${encoded}`,
		undefined,
		token,
	);

	return response.items[0] ?? null;
}

export async function createUserRecord(data: FormData, token: string) {
	return createRecord('users', data, token);
}

export async function createNutritionProfile(
	data: Record<string, unknown>,
	token: string,
) {
	return createRecord('profils_nutritionnels', data, token);
}

export async function authenticateUser(email: string, password: string) {
	const config = await getPocketBaseConfig();
	const response = await fetch(`${config.url}/api/collections/users/auth-with-password`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			identity: email,
			password,
		}),
	});

	const payload = await response.json();

	if (!response.ok) {
		throw new Error(payload?.message ?? 'Authentification impossible');
	}

	return payload;
}

export async function refreshUserAuth(userToken: string): Promise<AuthRefreshResponse> {
	return pbFetch<AuthRefreshResponse>(
		'/api/collections/users/auth-refresh',
		{
			method: 'POST',
		},
		userToken,
	);
}

export async function getUserRecordById(userId: string, token: string) {
	return pbFetch<Record<string, any>>(
		`/api/collections/users/records/${userId}?expand=objectif_id,niveau_activite_id,type_activite_id,regime_id`,
		undefined,
		token,
	);
}

export async function getFileUrl(
	collection: string,
	recordId: string,
	filename?: string | null,
): Promise<string | null> {
	if (!filename) {
		return null;
	}

	const baseUrl = await getPocketBaseBaseUrl();
	return `${baseUrl}/api/files/${collection}/${recordId}/${filename}`;
}

export async function getNutritionProfileByUserId(userId: string, token: string) {
	const encoded = encodeURIComponent(`user_id="${userId}"`);
	const response = await pbFetch<{ items: Record<string, any>[] }>(
		`/api/collections/profils_nutritionnels/records?perPage=1&filter=${encoded}`,
		undefined,
		token,
	);

	return response.items[0] ?? null;
}

export async function updateUserRecordById(
	userId: string,
	data: Record<string, unknown> | FormData,
	token: string,
) {
	return updateRecord('users', userId, data, token);
}

export async function upsertNutritionProfile(
	userId: string,
	data: Record<string, unknown>,
	token: string,
) {
	const existing = await getNutritionProfileByUserId(userId, token);

	if (existing?.id) {
		return updateRecord('profils_nutritionnels', existing.id, data, token);
	}

	return createNutritionProfile(
		{
			user_id: userId,
			...data,
		},
		token,
	);
}

async function ensureRecipeTags(token: string) {
	const existingTags = await listRecords<OptionRecord & { couleur?: string }>('tags', token);
	const existingBySlug = new Map(existingTags.map((tag) => [tag.slug ?? '', tag]));

	for (const tag of defaultRecipeTags) {
		if (!existingBySlug.has(tag.slug)) {
			const created = (await createRecord('tags', tag, token)) as OptionRecord & { couleur?: string };
			existingBySlug.set(tag.slug, created);
		}
	}

	return existingBySlug;
}

async function ensureRecipeMetadata(token: string) {
	const [recipes, diets, tagMap, existingRecipeDietLinks, existingRecipeTagLinks] = await Promise.all([
		listRecords<Record<string, any>>('recettes', token),
		listRecords<OptionRecord>('regimes_alimentaires', token),
		ensureRecipeTags(token),
		listRecords<Record<string, any>>('recettes_regimes', token),
		listRecords<Record<string, any>>('recettes_tags', token),
	]);

	const dietBySlug = new Map(diets.map((diet) => [diet.slug ?? '', diet]));
	const recipeDietLinkSet = new Set(existingRecipeDietLinks.map((item) => `${item.recette_id}:${item.regime_id}`));
	const recipeTagLinkSet = new Set(existingRecipeTagLinks.map((item) => `${item.recette_id}:${item.tag_id}`));

	for (const recipe of recipes) {
		const metadata = recipeMetadataBySlug[recipe.slug as string];
		if (!metadata) {
			continue;
		}

		for (const regimeSlug of metadata.regimeSlugs) {
			const diet = dietBySlug.get(regimeSlug);
			if (!diet) {
				continue;
			}

			const key = `${recipe.id}:${diet.id}`;
			if (!recipeDietLinkSet.has(key)) {
				await createRecord(
					'recettes_regimes',
					{
						recette_id: recipe.id,
						regime_id: diet.id,
					},
					token,
				);
				recipeDietLinkSet.add(key);
			}
		}

		for (const tagSlug of metadata.tagSlugs) {
			const tag = tagMap.get(tagSlug);
			if (!tag) {
				continue;
			}

			const key = `${recipe.id}:${tag.id}`;
			if (!recipeTagLinkSet.has(key)) {
				await createRecord(
					'recettes_tags',
					{
						recette_id: recipe.id,
						tag_id: tag.id,
					},
					token,
				);
				recipeTagLinkSet.add(key);
			}
		}
	}
}

export async function getRecipesCatalog(userToken: string) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const token = refreshedAuth.token;
	await ensureReferenceData(token);
	try {
		await ensureRecipeMetadata(token);
	} catch {
		// The catalog should still load even if auxiliary recipe metadata seeding fails.
	}

	const userId = String(refreshedAuth.record.id);
	const [user, objectives, diets, recipes, recipeDietLinks, recipeTagLinks] = await Promise.all([
		getUserRecordById(userId, token),
		listRecords<OptionRecord>('objectifs', token),
		listRecords<OptionRecord>('regimes_alimentaires', token),
		listRecordsWithQuery<Record<string, any>>(
			'recettes',
			'perPage=200&sort=-date_creation&filter=' + encodeURIComponent('is_published=true') + '&expand=objectif_id',
			token,
		),
		listRecordsWithQuery<Record<string, any>>('recettes_regimes', 'perPage=200&expand=regime_id', token),
		listRecordsWithQuery<Record<string, any>>('recettes_tags', 'perPage=200&expand=tag_id', token),
	]);

	const recipesBySlug = new Map<string, Record<string, any>>();
	for (const recipe of recipes) {
		if (!recipe.slug) {
			continue;
		}

		const existing = recipesBySlug.get(recipe.slug);
		if (!existing) {
			recipesBySlug.set(recipe.slug, recipe);
			continue;
		}

		if (new Date(String(recipe.date_creation ?? '')).getTime() > new Date(String(existing.date_creation ?? '')).getTime()) {
			recipesBySlug.set(recipe.slug, recipe);
		}
	}

	const dietLinksByRecipeId = new Map<string, Array<Record<string, any>>>();
	for (const link of recipeDietLinks) {
		const recipeId = String(link.recette_id);
		const items = dietLinksByRecipeId.get(recipeId) ?? [];
		items.push(link);
		dietLinksByRecipeId.set(recipeId, items);
	}

	const tagLinksByRecipeId = new Map<string, Array<Record<string, any>>>();
	for (const link of recipeTagLinks) {
		const recipeId = String(link.recette_id);
		const items = tagLinksByRecipeId.get(recipeId) ?? [];
		items.push(link);
		tagLinksByRecipeId.set(recipeId, items);
	}

	const items = await Promise.all(
		Array.from(recipesBySlug.values()).map(async (recipe) => {
			const imageUrl = await getFileUrl('recettes', String(recipe.id), recipe.photo);
			const recipeDiets = (dietLinksByRecipeId.get(String(recipe.id)) ?? [])
				.map((link) => link.expand?.regime_id)
				.filter(Boolean)
				.map((diet: Record<string, any>) => ({
					id: String(diet.id),
					libelle: String(diet.libelle),
					slug: String(diet.slug),
				}));
			const recipeTags = (tagLinksByRecipeId.get(String(recipe.id)) ?? [])
				.map((link) => link.expand?.tag_id)
				.filter(Boolean)
				.map((tag: Record<string, any>) => ({
					id: String(tag.id),
					libelle: String(tag.libelle),
					slug: String(tag.slug),
					couleur: String(tag.couleur ?? ''),
				}));

			return {
				id: String(recipe.id),
				slug: String(recipe.slug),
				titre: String(recipe.titre),
				description: String(recipe.description ?? ''),
				photoUrl: imageUrl,
				tempsPreparationMin: Number(recipe.temps_preparation_min ?? 0),
				caloriesParPortion: Number(recipe.calories_par_portion ?? 0),
				objectif: recipe.expand?.objectif_id
					? {
						id: String(recipe.expand.objectif_id.id),
						libelle: String(recipe.expand.objectif_id.libelle),
						slug: String(recipe.expand.objectif_id.slug),
					}
					: null,
				regimes: recipeDiets,
				tags: recipeTags,
			};
		}),
	);

	return {
		token,
		userDefaults: {
			objectifSlug: user.expand?.objectif_id?.slug ?? '',
			regimeSlug: user.expand?.regime_id?.slug ?? '',
		},
		filters: {
			objectives: objectives.map((goal) => ({
				id: goal.id,
				libelle: goal.libelle,
				slug: goal.slug ?? '',
			})),
			diets: diets.map((diet) => ({
				id: diet.id,
				libelle: diet.libelle,
				slug: diet.slug ?? '',
			})),
		},
		recipes: items,
	};
}

function parseJsonArray(value: unknown): Array<Record<string, any>> {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((item) => item && typeof item === 'object') as Array<Record<string, any>>;
}

export async function getRecipeDetailBySlug(userToken: string, slug: string) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const token = refreshedAuth.token;
	const userId = String(refreshedAuth.record.id);

	const recipeItems = await listRecordsWithQuery<Record<string, any>>(
		'recettes',
		`perPage=1&filter=${encodeURIComponent(`slug="${slug}"`)}&expand=objectif_id`,
		token,
	);

	const recipe = recipeItems[0];
	if (!recipe) {
		throw new Error('Recette introuvable.');
	}

	const recipeId = String(recipe.id);

	const [ingredientLinks, steps, reviews, similarLinks, recipeDietLinks, recipeTagLinks, allRecipes, allRecipeDietLinks] = await Promise.all([
		listRecordsWithQuery<Record<string, any>>(
			'ingredients_recette',
			`perPage=200&sort=ordre&filter=${encodeURIComponent(`recette_id="${recipeId}"`)}&expand=aliment_id`,
			token,
		),
		listRecordsWithQuery<Record<string, any>>(
			'recette_etapes',
			`perPage=200&sort=ordre&filter=${encodeURIComponent(`recette_id="${recipeId}"`)}`,
			token,
		),
		listRecordsWithQuery<Record<string, any>>(
			'avis_recettes',
			`perPage=200&sort=-date_avis&filter=${encodeURIComponent(`recette_id="${recipeId}"`)}&expand=user_id`,
			token,
		),
		listRecordsWithQuery<Record<string, any>>(
			'recettes_similaires',
			`perPage=200&filter=${encodeURIComponent(`recette_source_id="${recipeId}"`)}&expand=recette_similaire_id`,
			token,
		),
		listRecordsWithQuery<Record<string, any>>(
			'recettes_regimes',
			`perPage=200&filter=${encodeURIComponent(`recette_id="${recipeId}"`)}&expand=regime_id`,
			token,
		),
		listRecordsWithQuery<Record<string, any>>(
			'recettes_tags',
			`perPage=200&filter=${encodeURIComponent(`recette_id="${recipeId}"`)}&expand=tag_id`,
			token,
		),
		listRecordsWithQuery<Record<string, any>>(
			'recettes',
			'perPage=200&sort=-date_creation&filter=' + encodeURIComponent(`id!="${recipeId}" && is_published=true`),
			token,
		),
		listRecordsWithQuery<Record<string, any>>('recettes_regimes', 'perPage=400', token),
	]);

	const imageUrl = await getFileUrl('recettes', recipeId, recipe.photo);

	const ingredients = ingredientLinks.length
		? ingredientLinks.map((item, index) => ({
			id: String(item.id),
			ordre: Number(item.ordre ?? index + 1),
			nom: String(item.expand?.aliment_id?.nom ?? item.nom_affiche ?? 'Ingredient'),
			quantite: Number(item.quantite ?? 0),
			unite: String(item.unite ?? ''),
			preparation: String(item.preparation ?? ''),
			isOptionnel: Boolean(item.is_optionnel ?? false),
			groupe: String(item.groupe ?? ''),
		}))
		: parseJsonArray(recipe.ingredients_json).map((item, index) => ({
			id: String(item.aliment_id ?? `json-${index}`),
			ordre: Number(item.ordre ?? index + 1),
			nom: String(item.nom ?? 'Ingredient'),
			quantite: Number(item.quantite ?? 0),
			unite: String(item.unite ?? ''),
			preparation: String(item.preparation ?? ''),
			isOptionnel: Boolean(item.is_optionnel ?? false),
			groupe: String(item.groupe ?? ''),
		}));

	const preparationSteps = steps.length
		? steps.map((item, index) => ({
			id: String(item.id),
			ordre: Number(item.ordre ?? index + 1),
			titre: String(item.titre ?? `Etape ${index + 1}`),
			instruction: String(item.instruction ?? ''),
			dureeMin: Number(item.duree_min ?? 0),
		}))
		: parseJsonArray(recipe.etapes_json).map((item, index) => ({
			id: String(item.id ?? `json-step-${index}`),
			ordre: Number(item.ordre ?? index + 1),
			titre: String(item.titre ?? `Etape ${index + 1}`),
			instruction: String(item.instruction ?? ''),
			dureeMin: Number(item.duree_min ?? 0),
		}));

	const recipeReviews = reviews.length
		? reviews.map((item) => ({
			id: String(item.id),
			note: Number(item.note ?? 0),
			commentaire: String(item.commentaire ?? ''),
			dateAvis: String(item.date_avis ?? item.created ?? ''),
			auteur: String(item.expand?.user_id?.name ?? item.expand?.user_id?.email ?? 'Utilisateur'),
		}))
		: parseJsonArray(recipe.avis_json).map((item, index) => ({
			id: String(item.id ?? `json-review-${index}`),
			note: Number(item.note ?? 0),
			commentaire: String(item.commentaire ?? ''),
			dateAvis: '',
			auteur: String(item.auteur ?? 'Utilisateur'),
		}));

	let similarRecipes = await Promise.all(
		similarLinks
			.map((item) => item.expand?.recette_similaire_id)
			.filter(Boolean)
			.map(async (similarRecipe: Record<string, any>) => ({
				id: String(similarRecipe.id),
				slug: String(similarRecipe.slug ?? ''),
				titre: String(similarRecipe.titre ?? ''),
				caloriesParPortion: Number(similarRecipe.calories_par_portion ?? 0),
				tempsPreparationMin: Number(similarRecipe.temps_preparation_min ?? 0),
				photoUrl: await getFileUrl('recettes', String(similarRecipe.id), similarRecipe.photo),
			})),
	);

	const recipeDiets = recipeDietLinks
		.map((link) => link.expand?.regime_id)
		.filter(Boolean)
		.map((diet: Record<string, any>) => ({
			id: String(diet.id),
			libelle: String(diet.libelle),
			slug: String(diet.slug),
		}));

	const recipeTags = recipeTagLinks
		.map((link) => link.expand?.tag_id)
		.filter(Boolean)
		.map((tag: Record<string, any>) => ({
			id: String(tag.id),
			libelle: String(tag.libelle),
			slug: String(tag.slug),
			couleur: String(tag.couleur ?? ''),
		}));

	if (similarRecipes.length === 0) {
		const recipeDietIds = new Set(recipeDietLinks.map((link) => String(link.regime_id ?? '')));
		const recipeObjectiveId = String(recipe.objectif_id ?? '');
		const candidateDietIdsByRecipe = new Map<string, Set<string>>();
		for (const link of allRecipeDietLinks) {
			const candidateRecipeId = String(link.recette_id ?? '');
			const set = candidateDietIdsByRecipe.get(candidateRecipeId) ?? new Set<string>();
			set.add(String(link.regime_id ?? ''));
			candidateDietIdsByRecipe.set(candidateRecipeId, set);
		}

		const fallbackCandidates = allRecipes
			.map((candidate) => {
				let score = 0;
				if (recipeObjectiveId && String(candidate.objectif_id ?? '') === recipeObjectiveId) {
					score += 3;
				}
				const candidateDietIds = candidateDietIdsByRecipe.get(String(candidate.id)) ?? new Set<string>();
				const hasSharedDiet = Array.from(candidateDietIds).some((dietId) => recipeDietIds.has(dietId));
				if (hasSharedDiet) {
					score += 2;
				}
				score += Math.max(0, 120 - Math.abs(Number(candidate.calories_par_portion ?? 0) - Number(recipe.calories_par_portion ?? 0))) / 120;
				return { candidate, score };
			})
			.sort((left, right) => right.score - left.score)
			slice(0, 3);

		similarRecipes = await Promise.all(
			fallbackCandidates.map(async ({ candidate }) => ({
				id: String(candidate.id),
				slug: String(candidate.slug ?? ''),
				titre: String(candidate.titre ?? ''),
				caloriesParPortion: Number(candidate.calories_par_portion ?? 0),
				tempsPreparationMin: Number(candidate.temps_preparation_min ?? 0),
				photoUrl: await getFileUrl('recettes', String(candidate.id), candidate.photo),
			})),
		);
	}

	return {
		token,
		currentUser: {
			id: userId,
			name: String(refreshedAuth.record.name ?? refreshedAuth.record.prenom ?? refreshedAuth.record.email ?? 'Utilisateur'),
		},
		recipe: {
			id: recipeId,
			slug: String(recipe.slug),
			titre: String(recipe.titre),
			description: String(recipe.description ?? ''),
			photoUrl: imageUrl,
			tempsPreparationMin: Number(recipe.temps_preparation_min ?? 0),
			tempsCuissonMin: Number(recipe.temps_cuisson_min ?? 0),
			tempsTotalMin: Number(recipe.temps_total_min ?? 0),
			nombrePortions: Number(recipe.nombre_portions ?? 1),
			caloriesParPortion: Number(recipe.calories_par_portion ?? 0),
			proteinesParPortionG: Number(recipe.proteines_par_portion_g ?? 0),
			glucidesParPortionG: Number(recipe.glucides_par_portion_g ?? 0),
			lipidesParPortionG: Number(recipe.lipides_par_portion_g ?? 0),
			fibresParPortionG: Number(recipe.fibres_par_portion_g ?? 0),
			difficulte: String(recipe.difficulte ?? 'facile'),
			niveauEpice: String(recipe.niveau_epice ?? 'doux'),
			noteMoyenne: Number(recipe.note_moyenne ?? 0),
			nombreAvis: Number(recipe.nombre_avis ?? recipeReviews.length),
			astuceChef: String(recipe.astuce_chef ?? ''),
			objectif: recipe.expand?.objectif_id
				? {
					id: String(recipe.expand.objectif_id.id),
					libelle: String(recipe.expand.objectif_id.libelle),
					slug: String(recipe.expand.objectif_id.slug),
				}
				: null,
			regimes: recipeDiets,
			tags: recipeTags,
			ingredients,
			etapes: preparationSteps,
			avis: recipeReviews,
			similaires: similarRecipes,
		},
	};
}

export async function addRecipeReview(
	userToken: string,
	slug: string,
	data: { note: number; commentaire: string; titre?: string },
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const token = refreshedAuth.token;
	const userId = String(refreshedAuth.record.id);

	const recipeItems = await listRecordsWithQuery<Record<string, any>>(
		'recettes',
		`perPage=1&filter=${encodeURIComponent(`slug="${slug}"`)}`,
		token,
	);
	const recipe = recipeItems[0];

	if (!recipe?.id) {
		throw new Error('Recette introuvable.');
	}

	await createRecord(
		'avis_recettes',
		{
			recette_id: recipe.id,
			user_id: userId,
			note: Math.max(1, Math.min(5, Number(data.note))),
			titre: String(data.titre ?? '').trim(),
			commentaire: String(data.commentaire).trim(),
			date_avis: toStartOfDayIso(new Date().toISOString().slice(0, 10)),
			is_visible: true,
			is_verifie: false,
		},
		token,
	);

	const allReviews = await listRecordsWithQuery<Record<string, any>>(
		'avis_recettes',
		`perPage=200&filter=${encodeURIComponent(`recette_id="${recipe.id}" && is_visible=true`)}`,
		token,
	);
	const reviewCount = allReviews.length;
	const averageRating =
		reviewCount > 0
			? round(allReviews.reduce((sum, item) => sum + Number(item.note ?? 0), 0) / reviewCount)
			: 0;

	await updateRecord(
		'recettes',
		String(recipe.id),
		{
			note_moyenne: averageRating,
			nombre_avis: reviewCount,
		},
		token,
	);

	return getRecipeDetailBySlug(refreshedAuth.token, slug);
}

export async function getFoodsCatalog(userToken: string) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const token = refreshedAuth.token;
	const foods = await listRecordsWithQuery<Record<string, any>>('aliments', 'perPage=200&sort=nom', token);

	const items = await Promise.all(
		foods.map(async (food) => ({
			id: String(food.id),
			nom: String(food.nom),
			description: String(food.description ?? ''),
			categorie: String(food.categorie ?? 'autre'),
			uniteParDefaut: String(food.unite_par_defaut ?? 'g'),
			calories100g: Number(food.calories_100g ?? 0),
			proteines100g: Number(food.proteines_100g ?? 0),
			glucides100g: Number(food.glucides_100g ?? 0),
			lipides100g: Number(food.lipides_100g ?? 0),
			fibres100g: Number(food.fibres_100g ?? 0),
			imageUrl: await getFileUrl('aliments', String(food.id), food.image),
		})),
	);

	return {
		token,
		foods: items,
	};
}

const mealTypeOrder = ['petit_dejeuner', 'dejeuner', 'collation', 'diner'] as const;

const mealTypeLabels: Record<(typeof mealTypeOrder)[number], string> = {
	petit_dejeuner: 'Petit-déjeuner',
	dejeuner: 'Déjeuner',
	collation: 'Collation',
	diner: 'Dîner',
};

const foodDefaultQuantityByName: Record<string, number> = {
	banane: 120,
	pomme: 150,
	'barre cereales': 25,
	'kinder bueno': 43,
	'compote pomme': 100,
	'yaourt grec': 125,
	skyr: 140,
	amandes: 30,
};

function normalizeDateInput(value?: string) {
	const date = value ? new Date(`${value}T12:00:00`) : new Date();
	if (Number.isNaN(date.getTime())) {
		return new Date().toISOString().slice(0, 10);
	}
	return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}

function getWeekStartDate(dateInput?: string) {
	const base = new Date(`${normalizeDateInput(dateInput)}T12:00:00`);
	const dayIndex = (base.getDay() + 6) % 7;
	return addDays(base, -dayIndex);
}

function toDateOnly(value?: string) {
	if (!value) return '';
	return new Date(value).toISOString().slice(0, 10);
}

function toStartOfDayIso(dateString: string) {
	return `${dateString}T00:00:00.000Z`;
}

function formatWeekLabel(start: Date) {
	const end = addDays(start, 6);
	const formatter = new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: start.getMonth() === end.getMonth() ? undefined : 'numeric',
	});
	const year = new Intl.DateTimeFormat('fr-FR', { year: 'numeric' }).format(end);
	return `${formatter.format(start)} - ${formatter.format(end)} ${year}`;
}

function round(value: number) {
	return Math.round(value * 10) / 10;
}

async function getRecordById(collection: string, recordId: string, token: string) {
	return pbFetch<Record<string, any>>(`/api/collections/${collection}/records/${recordId}`, undefined, token);
}

async function getUserTrackingRecords(userId: string, token: string) {
	return listRecordsWithQuery<Record<string, any>>(
		'suivis_alimentaires',
		`perPage=400&sort=date_suivi&filter=${encodeURIComponent(`user_id="${userId}"`)}`,
		token,
	);
}

async function getOrCreateTrackingDayRecord(
	userId: string,
	dateString: string,
	goals: { calories: number; proteins: number; carbs: number; fats: number },
	token: string,
) {
	const existingRecords = await getUserTrackingRecords(userId, token);
	const existing = existingRecords.find((item) => toDateOnly(item.date_suivi) === dateString);

	if (existing) {
		return existing;
	}

	return createRecord(
		'suivis_alimentaires',
		{
			user_id: userId,
			date_suivi: toStartOfDayIso(dateString),
			calories_consommees: 0,
			proteines_consommees_g: 0,
			glucides_consommes_g: 0,
			lipides_consommes_g: 0,
			objectif_calories: goals.calories,
			objectif_proteines_g: goals.proteins,
			objectif_glucides_g: goals.carbs,
			objectif_lipides_g: goals.fats,
		},
		token,
	);
}

async function recomputeTrackingDayTotals(
	suiviId: string,
	goals: { calories: number; proteins: number; carbs: number; fats: number },
	token: string,
) {
	const [recipeEntries, foodEntries] = await Promise.all([
		listRecordsWithQuery<Record<string, any>>(
			'repas_consommes',
			`perPage=300&filter=${encodeURIComponent(`suivi_id="${suiviId}"`)}`,
			token,
		),
		listRecordsWithQuery<Record<string, any>>(
			'aliments_consommes',
			`perPage=300&filter=${encodeURIComponent(`suivi_id="${suiviId}"`)}`,
			token,
		),
	]);

	const totals = [...recipeEntries, ...foodEntries].reduce(
		(accumulator, entry) => ({
			calories: accumulator.calories + Number(entry.calories_total ?? 0),
			proteins: accumulator.proteins + Number(entry.proteines_total_g ?? 0),
			carbs: accumulator.carbs + Number(entry.glucides_total_g ?? 0),
			fats: accumulator.fats + Number(entry.lipides_total_g ?? 0),
		}),
		{ calories: 0, proteins: 0, carbs: 0, fats: 0 },
	);

	return updateRecord(
		'suivis_alimentaires',
		suiviId,
		{
			calories_consommees: round(totals.calories),
			proteines_consommees_g: round(totals.proteins),
			glucides_consommes_g: round(totals.carbs),
			lipides_consommes_g: round(totals.fats),
			objectif_calories: goals.calories,
			objectif_proteines_g: goals.proteins,
			objectif_glucides_g: goals.carbs,
			objectif_lipides_g: goals.fats,
		},
		token,
	);
}

function getFoodDefaultQuantity(foodName: string) {
	return foodDefaultQuantityByName[foodName.toLowerCase()] ?? 100;
}

function getDayStatus(consumed: number, target: number) {
	const ratio = target > 0 ? consumed / target : 0;
	if (ratio >= 0.95) return 'good';
	if (ratio >= 0.8) return 'medium';
	return 'low';
}

function getRegularityLabel(daysWithEntries: number) {
	if (daysWithEntries >= 6) return 'Excellente';
	if (daysWithEntries >= 4) return 'Bonne';
	if (daysWithEntries >= 2) return 'Moyenne';
	return 'À relancer';
}

export async function getTrackingDashboard(userToken: string, selectedDateInput?: string) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	const userId = String(refreshedAuth.record.id);
	const selectedDate = normalizeDateInput(selectedDateInput);
	const weekStart = getWeekStartDate(selectedDate);
	const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
	const weekDateKeys = weekDates.map((date) => date.toISOString().slice(0, 10));

	const [nutritionProfile, recipeCatalog, foodCatalog, allTracking, recipeEntries, foodEntries] = await Promise.all([
		getNutritionProfileByUserId(userId, adminToken),
		listRecordsWithQuery<Record<string, any>>('recettes', 'perPage=200&sort=-date_creation', adminToken),
		listRecordsWithQuery<Record<string, any>>('aliments', 'perPage=200&sort=nom', adminToken),
		getUserTrackingRecords(userId, adminToken),
		listRecordsWithQuery<Record<string, any>>('repas_consommes', 'perPage=500&sort=created&expand=recette_id', adminToken),
		listRecordsWithQuery<Record<string, any>>('aliments_consommes', 'perPage=500&expand=aliment_id', adminToken),
	]);

	const goals = {
		calories: Number(nutritionProfile?.calories_journalieres ?? 0),
		proteins: Number(nutritionProfile?.proteines_journalieres_g ?? 0),
		carbs: Number(nutritionProfile?.glucides_journaliers_g ?? 0),
		fats: Number(nutritionProfile?.lipides_journaliers_g ?? 0),
	};

	const weekTracking = allTracking.filter((item) => weekDateKeys.includes(toDateOnly(item.date_suivi)));
	const trackingByDate = new Map(weekTracking.map((item) => [toDateOnly(item.date_suivi), item]));
	const validSuiviIds = new Set(weekTracking.map((item) => String(item.id)));

	const weeklyRecipeEntries = recipeEntries.filter((entry) => validSuiviIds.has(String(entry.suivi_id)));
	const weeklyFoodEntries = foodEntries.filter((entry) => validSuiviIds.has(String(entry.suivi_id)));

	const recipeImageCache = new Map<string, string | null>();
	const foodImageCache = new Map<string, string | null>();

	const selectedTracking = trackingByDate.get(selectedDate) ?? null;
	const selectedEntries = [
		...weeklyRecipeEntries
			.filter((entry) => String(entry.suivi_id) === String(selectedTracking?.id ?? ''))
			.map(async (entry) => {
				const recipeId = String(entry.recette_id);
				if (!recipeImageCache.has(recipeId)) {
					recipeImageCache.set(
						recipeId,
						await getFileUrl('recettes', recipeId, entry.expand?.recette_id?.photo),
					);
				}

				return {
					id: String(entry.id),
					sourceType: 'recipe',
					sourceId: recipeId,
					title: String(entry.expand?.recette_id?.titre ?? 'Recette'),
					mealType: String(entry.type_repas),
					mealLabel: mealTypeLabels[String(entry.type_repas) as keyof typeof mealTypeLabels],
					quantity: Number(entry.portions_consommees ?? 1),
					quantityLabel: `${round(Number(entry.portions_consommees ?? 1))} portion${Number(entry.portions_consommees ?? 1) > 1 ? 's' : ''}`,
					calories: Number(entry.calories_total ?? 0),
					proteins: Number(entry.proteines_total_g ?? 0),
					carbs: Number(entry.glucides_total_g ?? 0),
					fats: Number(entry.lipides_total_g ?? 0),
					imageUrl: recipeImageCache.get(recipeId),
				};
			}),
		...weeklyFoodEntries
			.filter((entry) => String(entry.suivi_id) === String(selectedTracking?.id ?? ''))
			.map(async (entry) => {
				const foodId = String(entry.aliment_id);
				if (!foodImageCache.has(foodId)) {
					foodImageCache.set(
						foodId,
						await getFileUrl('aliments', foodId, entry.expand?.aliment_id?.image),
					);
				}

				return {
					id: String(entry.id),
					sourceType: 'food',
					sourceId: foodId,
					title: String(entry.expand?.aliment_id?.nom ?? 'Aliment'),
					mealType: String(entry.type_repas),
					mealLabel: mealTypeLabels[String(entry.type_repas) as keyof typeof mealTypeLabels],
					quantity: Number(entry.quantite_g ?? 0),
					quantityLabel: `${round(Number(entry.quantite_g ?? 0))} g`,
					calories: Number(entry.calories_total ?? 0),
					proteins: Number(entry.proteines_total_g ?? 0),
					carbs: Number(entry.glucides_total_g ?? 0),
					fats: Number(entry.lipides_total_g ?? 0),
					imageUrl: foodImageCache.get(foodId),
				};
			}),
	];

	const selectedDayEntries = (await Promise.all(selectedEntries)).sort(
		(a, b) => mealTypeOrder.indexOf(a.mealType as (typeof mealTypeOrder)[number]) - mealTypeOrder.indexOf(b.mealType as (typeof mealTypeOrder)[number]),
	);

	const days = weekDateKeys.map((dateKey, index) => {
		const tracking = trackingByDate.get(dateKey);
		const calories = Number(tracking?.calories_consommees ?? 0);
		return {
			date: dateKey,
			label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(weekDates[index]).replace('.', ''),
			dayNumber: new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(weekDates[index]),
			isToday: dateKey === new Date().toISOString().slice(0, 10),
			isSelected: dateKey === selectedDate,
			calories,
			targetCalories: goals.calories,
			status: getDayStatus(calories, goals.calories),
		};
	});

	const weeklyTotals = weekDateKeys.reduce(
		(accumulator, dateKey) => {
			const tracking = trackingByDate.get(dateKey);
			return {
				calories: accumulator.calories + Number(tracking?.calories_consommees ?? 0),
				proteins: accumulator.proteins + Number(tracking?.proteines_consommees_g ?? 0),
				carbs: accumulator.carbs + Number(tracking?.glucides_consommes_g ?? 0),
				fats: accumulator.fats + Number(tracking?.lipides_consommes_g ?? 0),
				daysWithEntries: accumulator.daysWithEntries + (tracking && Number(tracking?.calories_consommees ?? 0) > 0 ? 1 : 0),
				complianceDays:
					accumulator.complianceDays +
					(getDayStatus(Number(tracking?.calories_consommees ?? 0), goals.calories) === 'good' ? 1 : 0),
			};
		},
		{ calories: 0, proteins: 0, carbs: 0, fats: 0, daysWithEntries: 0, complianceDays: 0 },
	);

	const selectedDaySummary = {
		date: selectedDate,
		title: selectedDate === new Date().toISOString().slice(0, 10) ? "Aujourd'hui" : new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${selectedDate}T12:00:00`)),
		formattedDate: new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${selectedDate}T12:00:00`)),
		caloriesConsumed: Number(selectedTracking?.calories_consommees ?? 0),
		caloriesTarget: goals.calories,
		proteinsConsumed: Number(selectedTracking?.proteines_consommees_g ?? 0),
		proteinsTarget: goals.proteins,
		carbsConsumed: Number(selectedTracking?.glucides_consommes_g ?? 0),
		carbsTarget: goals.carbs,
		fatsConsumed: Number(selectedTracking?.lipides_consommes_g ?? 0),
		fatsTarget: goals.fats,
		entries: selectedDayEntries,
	};

	const weeklySummary = {
		averageCalories: round(weeklyTotals.calories / 7),
		averageProteins: round(weeklyTotals.proteins / 7),
		averageCarbs: round(weeklyTotals.carbs / 7),
		averageFats: round(weeklyTotals.fats / 7),
		complianceDays: weeklyTotals.complianceDays,
		daysWithEntries: weeklyTotals.daysWithEntries,
		proteinRate: goals.proteins > 0 ? Math.min(100, Math.round((weeklyTotals.proteins / 7 / goals.proteins) * 100)) : 0,
		regularityLabel: getRegularityLabel(weeklyTotals.daysWithEntries),
		regularityRate: Math.round((weeklyTotals.daysWithEntries / 7) * 100),
	};

	const suggestedRecipes = await Promise.all(
		recipeCatalog.slice(0, 8).map(async (recipe) => ({
			id: String(recipe.id),
			title: String(recipe.titre),
			calories: Number(recipe.calories_par_portion ?? 0),
			proteins: Number(recipe.proteines_par_portion_g ?? 0),
			carbs: Number(recipe.glucides_par_portion_g ?? 0),
			fats: Number(recipe.lipides_par_portion_g ?? 0),
			quantityDefault: 1,
			imageUrl: await getFileUrl('recettes', String(recipe.id), recipe.photo),
		})),
	);

	const snackPriorityNames = ['Banane', 'Barre cereales', 'Kinder Bueno', 'Compote pomme', 'Amandes', 'Skyr', 'Yaourt grec'];
	const prioritizedFoods = [...foodCatalog].sort((left, right) => {
		const leftIndex = snackPriorityNames.findIndex((name) => name.toLowerCase() === String(left.nom).toLowerCase());
		const rightIndex = snackPriorityNames.findIndex((name) => name.toLowerCase() === String(right.nom).toLowerCase());
		const normalizedLeft = leftIndex === -1 ? 999 : leftIndex;
		const normalizedRight = rightIndex === -1 ? 999 : rightIndex;
		return normalizedLeft - normalizedRight || String(left.nom).localeCompare(String(right.nom), 'fr');
	});

	const suggestedFoods = await Promise.all(
		prioritizedFoods.slice(0, 12).map(async (food) => ({
			id: String(food.id),
			name: String(food.nom),
			category: String(food.categorie),
			calories100g: Number(food.calories_100g ?? 0),
			proteins100g: Number(food.proteines_100g ?? 0),
			carbs100g: Number(food.glucides_100g ?? 0),
			fats100g: Number(food.lipides_100g ?? 0),
			defaultQuantityG: getFoodDefaultQuantity(String(food.nom)),
			imageUrl: await getFileUrl('aliments', String(food.id), food.image),
		})),
	);

	return {
		token: refreshedAuth.token,
		selectedDate,
		week: {
			start: weekDateKeys[0],
			end: weekDateKeys[6],
			label: formatWeekLabel(weekStart),
			days,
		},
		goals,
		selectedDay: selectedDaySummary,
		weeklySummary,
		suggestions: {
			recipes: suggestedRecipes,
			foods: suggestedFoods,
		},
	};
}

export async function addTrackingEntry(
	userToken: string,
	data: {
		date: string;
		typeRepas: string;
		sourceType: 'recipe' | 'food';
		sourceId: string;
		quantity: number;
	},
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	const userId = String(refreshedAuth.record.id);
	const nutritionProfile = await getNutritionProfileByUserId(userId, adminToken);
	const goals = {
		calories: Number(nutritionProfile?.calories_journalieres ?? 0),
		proteins: Number(nutritionProfile?.proteines_journalieres_g ?? 0),
		carbs: Number(nutritionProfile?.glucides_journaliers_g ?? 0),
		fats: Number(nutritionProfile?.lipides_journaliers_g ?? 0),
	};

	const trackingDay = await getOrCreateTrackingDayRecord(userId, normalizeDateInput(data.date), goals, adminToken);

	if (data.sourceType === 'recipe') {
		const recipe = await getRecordById('recettes', data.sourceId, adminToken);
		await createRecord(
			'repas_consommes',
			{
				suivi_id: trackingDay.id,
				recette_id: recipe.id,
				type_repas: data.typeRepas,
				portions_consommees: data.quantity,
				calories_total: round(Number(recipe.calories_par_portion ?? 0) * data.quantity),
				proteines_total_g: round(Number(recipe.proteines_par_portion_g ?? 0) * data.quantity),
				glucides_total_g: round(Number(recipe.glucides_par_portion_g ?? 0) * data.quantity),
				lipides_total_g: round(Number(recipe.lipides_par_portion_g ?? 0) * data.quantity),
			},
			adminToken,
		);
	} else {
		const food = await getRecordById('aliments', data.sourceId, adminToken);
		const ratio = data.quantity / 100;
		await createRecord(
			'aliments_consommes',
			{
				suivi_id: trackingDay.id,
				aliment_id: food.id,
				type_repas: data.typeRepas,
				quantite_g: data.quantity,
				calories_total: round(Number(food.calories_100g ?? 0) * ratio),
				proteines_total_g: round(Number(food.proteines_100g ?? 0) * ratio),
				glucides_total_g: round(Number(food.glucides_100g ?? 0) * ratio),
				lipides_total_g: round(Number(food.lipides_100g ?? 0) * ratio),
			},
			adminToken,
		);
	}

	await recomputeTrackingDayTotals(String(trackingDay.id), goals, adminToken);
	return getTrackingDashboard(refreshedAuth.token, data.date);
}

export async function removeTrackingEntry(
	userToken: string,
	data: {
		date: string;
		sourceType: 'recipe' | 'food';
		entryId: string;
	},
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	const userId = String(refreshedAuth.record.id);
	const nutritionProfile = await getNutritionProfileByUserId(userId, adminToken);
	const goals = {
		calories: Number(nutritionProfile?.calories_journalieres ?? 0),
		proteins: Number(nutritionProfile?.proteines_journalieres_g ?? 0),
		carbs: Number(nutritionProfile?.glucides_journaliers_g ?? 0),
		fats: Number(nutritionProfile?.lipides_journaliers_g ?? 0),
	};

	await pbFetch(
		`/api/collections/${data.sourceType === 'recipe' ? 'repas_consommes' : 'aliments_consommes'}/records/${data.entryId}`,
		{ method: 'DELETE' },
		adminToken,
	);

	const trackingRecords = await getUserTrackingRecords(userId, adminToken);
	const trackingDay = trackingRecords.find((item) => toDateOnly(item.date_suivi) === normalizeDateInput(data.date));
	if (trackingDay?.id) {
		await recomputeTrackingDayTotals(String(trackingDay.id), goals, adminToken);
	}

	return getTrackingDashboard(refreshedAuth.token, data.date);
}
