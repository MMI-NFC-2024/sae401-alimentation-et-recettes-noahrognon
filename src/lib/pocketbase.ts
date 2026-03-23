
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

	const url = process.env.POCKETBASE_URL;
	const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
	const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

	if (url && adminEmail && adminPassword) {
		cachedConfig = {
			url: url.replace(/\/+$/, ''),
			adminEmail,
			adminPassword,
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

async function deleteRecord(collection: string, recordId: string, token: string) {
	return pbFetch(`/api/collections/${collection}/records/${recordId}`, {
		method: 'DELETE',
	}, token);
}

async function getCollectionMeta(collection: string, token: string) {
	return pbFetch<Record<string, any>>(`/api/collections/${collection}`, undefined, token);
}

function getCollectionFieldNames(collectionMeta: Record<string, any> | null | undefined) {
	const fields = Array.isArray(collectionMeta?.fields) ? collectionMeta.fields : [];
	return new Set(
		fields
			.map((field) => String(field?.name ?? '').trim())
			.filter(Boolean),
	);
}

async function ensureBaseCollection(
	name: string,
	fields: Array<Record<string, unknown>>,
	token: string,
) {
	try {
		await getCollectionMeta(name, token);
		return;
	} catch {
		await pbFetch('/api/collections', {
			method: 'POST',
			body: JSON.stringify({
				name,
				type: 'base',
				listRule: null,
				viewRule: null,
				createRule: null,
				updateRule: null,
				deleteRule: null,
				fields,
			}),
		}, token);
	}
}

async function ensureCollectionFields(
	collectionName: string,
	fieldsToAdd: Array<Record<string, unknown>>,
	token: string,
) {
	const meta = await getCollectionMeta(collectionName, token);
	const existingNames = new Set((meta.fields ?? []).map((field: Record<string, any>) => String(field.name)));
	const missingFields = fieldsToAdd.filter((field) => !existingNames.has(String(field.name ?? '')));

	if (!missingFields.length) {
		return meta;
	}

	await pbFetch(`/api/collections/${collectionName}`, {
		method: 'PATCH',
		body: JSON.stringify({
			fields: [...(meta.fields ?? []).filter((field: Record<string, any>) => !field.system), ...missingFields],
		}),
	}, token);

	return getCollectionMeta(collectionName, token);
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
				proteinesParPortion: Number(recipe.proteines_par_portion_g ?? 0),
				glucidesParPortion: Number(recipe.glucides_par_portion_g ?? 0),
				lipidesParPortion: Number(recipe.lipides_par_portion_g ?? 0),
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
	const adminToken = await authenticatePocketBaseAdmin();

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

	await ensureFavoriteRecipeCollections(adminToken);

	const [ingredientLinks, steps, reviews, similarLinks, recipeDietLinks, recipeTagLinks, allRecipes, allRecipeDietLinks, favoriteLinks] = await Promise.all([
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
		listRecordsWithQuery<Record<string, any>>(
			'recettes_favorites',
			`perPage=500&filter=${encodeURIComponent(`recette_id="${recipeId}"`)}`,
			adminToken,
		),
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

	const favoriteCount = favoriteLinks.length;
	const isFavorite = favoriteLinks.some((item) => String(item.user_id ?? '') === userId);

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
			.slice(0, 3);

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
			isFavorite,
			favoriteCount,
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

function dataUrlToFormFile(dataUrl: string, fallbackName: string) {
	const match = String(dataUrl ?? '').match(/^data:([^;]+);base64,(.+)$/);
	if (!match) {
		throw new Error("Image scannée invalide.");
	}

	const mimeType = match[1];
	const base64 = match[2];
	const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
	const extension = mimeType.split('/')[1] || 'png';
	const blob = new Blob([bytes], { type: mimeType });

	return {
		blob,
		fileName: `${fallbackName}.${extension.replace(/[^a-z0-9]/gi, '') || 'png'}`,
	};
}

function buildRecipePlaceholderImageDataUrl(title: string) {
	void title;
	return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nX1EAAAAASUVORK5CYII=';
}

export async function createFoodFromScan(
	userToken: string,
	data: {
		imageDataUrl?: string;
		nom: string;
		marque?: string;
		categorie: string;
		description?: string;
		uniteParDefaut?: string;
		calories100g: number;
		proteines100g: number;
		glucides100g: number;
		lipides100g: number;
		fibres100g: number;
	},
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	const foodsCollection = await getCollectionMeta('aliments', adminToken);
	const fieldNames = getCollectionFieldNames(foodsCollection);

	const cleanName = String(data.nom ?? '').trim();
	const cleanBrand = String(data.marque ?? '').trim();
	const description = [cleanBrand, String(data.description ?? '').trim()].filter(Boolean).join(' · ');
	const appendIfExists = (target: FormData, field: string, value: string) => {
		if (fieldNames.has(field)) {
			target.append(field, value);
		}
	};
	const optionalRetryFields = ['photo', 'date_creation', 'auteur_id', 'objectif_id'];

	const buildFoodFormData = (includeImage: boolean) => {
		const formData = new FormData();
		appendIfExists(formData, 'nom', cleanName || 'Produit à vérifier');
		appendIfExists(formData, 'description', description);
		appendIfExists(formData, 'categorie', String(data.categorie ?? 'autre'));
		appendIfExists(formData, 'unite_par_defaut', String(data.uniteParDefaut ?? 'g'));
		appendIfExists(formData, 'calories_100g', String(Number(data.calories100g ?? 0)));
		appendIfExists(formData, 'proteines_100g', String(Number(data.proteines100g ?? 0)));
		appendIfExists(formData, 'glucides_100g', String(Number(data.glucides100g ?? 0)));
		appendIfExists(formData, 'lipides_100g', String(Number(data.lipides100g ?? 0)));
		appendIfExists(formData, 'fibres_100g', String(Number(data.fibres100g ?? 0)));

		if (includeImage && data.imageDataUrl && fieldNames.has('image')) {
			const file = dataUrlToFormFile(
				data.imageDataUrl,
				cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'produit-scanne',
			);
			formData.append('image', file.blob, file.fileName);
		}

		return formData;
	};

	let created: Record<string, any>;
	try {
		created = (await createRecord('aliments', buildFoodFormData(true), adminToken)) as Record<string, any>;
	} catch (error) {
		const message = error instanceof Error ? error.message.toLowerCase() : '';
		if (data.imageDataUrl && fieldNames.has('image') && (message.includes('image') || message.includes('file') || message.includes('multipart'))) {
			created = (await createRecord('aliments', buildFoodFormData(false), adminToken)) as Record<string, any>;
		} else {
			throw error;
		}
	}

	return {
		token: refreshedAuth.token,
		food: {
			id: String(created.id),
			nom: String(created.nom),
			description: String(created.description ?? ''),
			categorie: String(created.categorie ?? 'autre'),
			uniteParDefaut: String(created.unite_par_defaut ?? 'g'),
			calories100g: Number(created.calories_100g ?? 0),
			proteines100g: Number(created.proteines_100g ?? 0),
			glucides100g: Number(created.glucides_100g ?? 0),
			lipides100g: Number(created.lipides_100g ?? 0),
			fibres100g: Number(created.fibres_100g ?? 0),
			imageUrl: await getFileUrl('aliments', String(created.id), created.image),
		},
	};
}

export async function createRecipeFromAssistant(
	userToken: string,
	draft: {
		titre: string;
		description: string;
		nombrePortions: number;
		tempsPreparationMin: number;
		tempsCuissonMin: number;
		tempsTotalMin: number;
		difficulte: string;
		caloriesParPortion: number;
		proteinesParPortionG: number;
		glucidesParPortionG: number;
		lipidesParPortionG: number;
		fibresParPortionG: number;
		tags?: string[];
		ingredients: Array<{
			nom: string;
			quantite: number;
			unite: string;
			preparation?: string;
		}>;
		etapes: Array<{
			titre: string;
			instruction: string;
			dureeMin?: number;
		}>;
	},
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureReferenceData(adminToken);

	const [user, recipesCollection, allRecipes] = await Promise.all([
		getUserRecordById(String(refreshedAuth.record.id), adminToken),
		getCollectionMeta('recettes', adminToken),
		listRecordsWithQuery<Record<string, any>>('recettes', 'perPage=400', adminToken),
	]);

	const fieldNames = getCollectionFieldNames(recipesCollection);
	const appendIfExists = (target: FormData, field: string, value: string) => {
		if (fieldNames.has(field)) {
			target.append(field, value);
		}
	};

	const baseSlug = slugifyKey(String(draft.titre ?? 'recette-nutrivia')) || 'recette-nutrivia';
	let slug = baseSlug;
	let suffix = 2;
	const existingSlugs = new Set(allRecipes.map((recipe) => String(recipe.slug ?? '')).filter(Boolean));
	while (existingSlugs.has(slug)) {
		slug = `${baseSlug}-${suffix}`;
		suffix += 1;
	}

	const placeholderImage = dataUrlToFormFile(buildRecipePlaceholderImageDataUrl(String(draft.titre ?? 'Recette')), slug || 'recette-nutrivia');
	const formData = new FormData();
	appendIfExists(formData, 'titre', String(draft.titre ?? 'Recette personnalisée').trim() || 'Recette personnalisée');
	appendIfExists(
		formData,
		'description',
		String(draft.description ?? '').trim() || 'Recette personnalisée créée avec NutrivIA à partir des besoins utilisateur.',
	);
	appendIfExists(formData, 'slug', slug);
	appendIfExists(formData, 'temps_preparation_min', String(Math.max(0, Number(draft.tempsPreparationMin ?? 0))));
	appendIfExists(formData, 'temps_cuisson_min', String(Math.max(0, Number(draft.tempsCuissonMin ?? 0))));
	appendIfExists(formData, 'temps_total_min', String(Math.max(0, Number(draft.tempsTotalMin ?? 0))));
	appendIfExists(formData, 'nombre_portions', String(Math.max(1, Number(draft.nombrePortions ?? 1))));
	appendIfExists(formData, 'calories_par_portion', String(Math.max(0, Number(draft.caloriesParPortion ?? 0))));
	appendIfExists(formData, 'proteines_par_portion_g', String(Math.max(0, Number(draft.proteinesParPortionG ?? 0))));
	appendIfExists(formData, 'glucides_par_portion_g', String(Math.max(0, Number(draft.glucidesParPortionG ?? 0))));
	appendIfExists(formData, 'lipides_par_portion_g', String(Math.max(0, Number(draft.lipidesParPortionG ?? 0))));
	appendIfExists(formData, 'fibres_par_portion_g', String(Math.max(0, Number(draft.fibresParPortionG ?? 0))));
	appendIfExists(formData, 'difficulte', String(draft.difficulte ?? 'facile'));
	appendIfExists(formData, 'is_published', 'true');
	appendIfExists(formData, 'date_creation', new Date().toISOString());
	if (user.objectif_id) {
		appendIfExists(formData, 'objectif_id', String(user.objectif_id));
	}
	if (user.id) {
		appendIfExists(formData, 'auteur_id', String(user.id));
	}
	appendIfExists(
		formData,
		'ingredients_json',
		JSON.stringify(
			(draft.ingredients ?? []).map((ingredient, index) => ({
				id: `ia-ingredient-${index + 1}`,
				ordre: index + 1,
				nom: String(ingredient.nom ?? '').trim(),
				quantite: Number(ingredient.quantite ?? 0),
				unite: String(ingredient.unite ?? '').trim(),
				preparation: String(ingredient.preparation ?? '').trim(),
			})),
		),
	);
	appendIfExists(
		formData,
		'etapes_json',
		JSON.stringify(
			(draft.etapes ?? []).map((step, index) => ({
				id: `ia-step-${index + 1}`,
				ordre: index + 1,
				titre: String(step.titre ?? `Étape ${index + 1}`).trim(),
				instruction: String(step.instruction ?? '').trim(),
				duree_min: Number(step.dureeMin ?? 0),
			})),
		),
	);

	if (fieldNames.has('photo')) {
		formData.append('photo', placeholderImage.blob, placeholderImage.fileName);
	}

	let created: Record<string, any>;
	try {
		created = (await createRecord('recettes', formData, adminToken)) as Record<string, any>;
	} catch (error) {
		const message = error instanceof Error ? error.message.toLowerCase() : '';
		const shouldRetry =
			optionalRetryFields.some((field) => message.includes(field)) ||
			message.includes('image') ||
			message.includes('file') ||
			message.includes('multipart') ||
			message.includes('validation');
		if (!shouldRetry) {
			throw error;
		}

		const buildRetryFormData = (omitFields: string[]) => {
			const fallbackFormData = new FormData();
			for (const [key, value] of formData.entries()) {
				if (!omitFields.includes(String(key))) {
					fallbackFormData.append(key, value as string);
				}
			}
			return fallbackFormData;
		};

		try {
			created = (await createRecord('recettes', buildRetryFormData(['photo']), adminToken)) as Record<string, any>;
		} catch (retryError) {
			try {
				created = (await createRecord(
					'recettes',
					buildRetryFormData(['photo', 'date_creation', 'auteur_id', 'objectif_id']),
					adminToken,
				)) as Record<string, any>;
			} catch {
				throw retryError;
			}
		}
	}

	try {
		if (user.regime_id) {
			await createRecord(
				'recettes_regimes',
				{
					recette_id: String(created.id),
					regime_id: String(user.regime_id),
				},
				adminToken,
			);
		}
	} catch {
		// Non bloquant si la table de lien n'est pas alignée.
	}

	try {
		if ((draft.tags ?? []).length) {
			const tagMap = await ensureRecipeTags(adminToken);
			for (const tagLabel of draft.tags ?? []) {
				const slugTag = slugifyKey(String(tagLabel ?? ''));
				let tag = tagMap.get(slugTag);
				if (!tag && slugTag) {
					tag = (await createRecord(
						'tags',
						{
							libelle: String(tagLabel).trim(),
							slug: slugTag,
							couleur: '#eefbf5',
						},
						adminToken,
					)) as OptionRecord & { couleur?: string };
					tagMap.set(slugTag, tag);
				}
				if (tag?.id) {
					await createRecord(
						'recettes_tags',
						{
							recette_id: String(created.id),
							tag_id: String(tag.id),
						},
						adminToken,
					);
				}
			}
		}
	} catch {
		// Non bloquant.
	}

	const detail = await getRecipeDetailBySlug(refreshedAuth.token, slug);
	return {
		token: refreshedAuth.token,
		recipe: {
			id: detail.recipe.id,
			slug: detail.recipe.slug,
			titre: detail.recipe.titre,
			photoUrl: detail.recipe.photoUrl,
		},
	};
}

const mealTypeOrder = ['petit_dejeuner', 'dejeuner', 'collation', 'diner'] as const;

const mealTypeLabels: Record<(typeof mealTypeOrder)[number], string> = {
	petit_dejeuner: 'Petit-déjeuner',
	dejeuner: 'Déjeuner',
	collation: 'Collation',
	diner: 'Dîner',
};

const plannerMealTypeOrder = ['petit_dejeuner', 'dejeuner', 'diner'] as const;

const plannerMealTypeLabels: Record<(typeof plannerMealTypeOrder)[number], string> = {
	petit_dejeuner: 'Petit-déjeuner',
	dejeuner: 'Déjeuner',
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

function getDashboardRecipeScore(
	recipe: Record<string, any>,
	defaults: { objectifSlug?: string; regimeSlug?: string },
) {
	let score = 0;
	if (defaults.objectifSlug && recipe.objectif?.slug === defaults.objectifSlug) {
		score += 3;
	}
	if (defaults.regimeSlug && Array.isArray(recipe.regimes) && recipe.regimes.some((item: Record<string, any>) => item.slug === defaults.regimeSlug)) {
		score += 3;
	}

	const title = String(recipe.titre ?? '').toLowerCase();
	const tags = Array.isArray(recipe.tags) ? recipe.tags.map((item: Record<string, any>) => String(item.slug ?? '')) : [];
	const calories = Number(recipe.caloriesParPortion ?? 0);
	const proteins = Number(recipe.proteinesParPortion ?? 0);

	if (defaults.objectifSlug === 'prise-masse') {
		score += proteins / 20;
		if (tags.includes('riche-proteines')) score += 2;
		if (calories >= 420) score += 1;
	}

	if (defaults.objectifSlug === 'perte-poids') {
		score += Math.max(0, 450 - calories) / 100;
		if (tags.includes('faible-calories')) score += 2;
	}

	if (defaults.objectifSlug === 'equilibre' || defaults.objectifSlug === 'maintien') {
		if (tags.includes('equilibre')) score += 2;
		if (calories >= 320 && calories <= 560) score += 1;
	}

	if (title.includes('salade') || title.includes('bowl') || title.includes('saumon')) {
		score += 0.5;
	}

	return score;
}

export async function getUserDashboard(userToken: string) {
	const today = normalizeDateInput();
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	const userId = String(refreshedAuth.record.id);

	const [user, nutritionProfile, trackingDashboard, plannerDashboard, recipesCatalog] = await Promise.all([
		getUserRecordById(userId, adminToken),
		getNutritionProfileByUserId(userId, adminToken),
		getTrackingDashboard(refreshedAuth.token, today),
		getMealPlannerDashboard(refreshedAuth.token, today),
		getRecipesCatalog(refreshedAuth.token),
	]);

	const avatarUrl = await getFileUrl('users', String(user.id), user.avatar);
	const firstName = String(user.prenom || user.name || 'Utilisateur').trim().split(' ')[0];
	const fullName = String(`${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.name || 'Utilisateur');
	const activityLabel = String(user.expand?.niveau_activite_id?.libelle ?? 'Actif');
	const goalLabel = String(user.expand?.objectif_id?.libelle ?? 'Équilibre');
	const goalSlug = String(user.expand?.objectif_id?.slug ?? '');
	const dietLabel = String(user.expand?.regime_id?.libelle ?? 'Classique');
	const sessions = Number(user.seances_par_semaine ?? 0);
	const currentWeight = Number(user.poids_actuel_kg ?? 0);
	const targetWeight = Number(user.poids_objectif_kg ?? currentWeight);
	const caloriesTarget = Number(nutritionProfile?.calories_journalieres ?? trackingDashboard.goals.calories ?? 0);
	const proteinsTarget = Number(nutritionProfile?.proteines_journalieres_g ?? trackingDashboard.goals.proteins ?? 0);
	const carbsTarget = Number(nutritionProfile?.glucides_journaliers_g ?? trackingDashboard.goals.carbs ?? 0);
	const fatsTarget = Number(nutritionProfile?.lipides_journaliers_g ?? trackingDashboard.goals.fats ?? 0);

	const todayPlanning =
		plannerDashboard.week.days.find((day) => day.date === today)?.meals.filter((meal) => meal.entry).map((meal) => ({
			mealType: meal.mealType,
			mealLabel: meal.mealLabel,
			id: String(meal.entry.id),
			recipeId: String(meal.entry.recipeId),
			slug: String(meal.entry.slug ?? ''),
			title: String(meal.entry.title),
			calories: Number(meal.entry.calories ?? 0),
			portions: Number(meal.entry.portions ?? 1),
			imageUrl: meal.entry.imageUrl,
		})) ?? [];

	const recommendedRecipes = [...recipesCatalog.recipes]
		.sort((left, right) => getDashboardRecipeScore(right, recipesCatalog.userDefaults) - getDashboardRecipeScore(left, recipesCatalog.userDefaults))
		.slice(0, 3)
		.map((recipe) => ({
			id: recipe.id,
			slug: recipe.slug,
			title: recipe.titre,
			calories: Number(recipe.caloriesParPortion ?? 0),
			duration: Number(recipe.tempsPreparationMin ?? 0),
			imageUrl: recipe.photoUrl,
			badge: recipe.tags?.[0]?.libelle ?? recipe.objectif?.libelle ?? 'Recommandée',
		}));

	const weightGap = round(Math.abs(currentWeight - targetWeight));
	const weeklyPace =
		goalSlug === 'prise-masse' ? 0.3 :
			goalSlug === 'perte-poids' ? 0.5 :
				0.2;
	const weeklyPaceLabel =
		goalSlug === 'prise-masse' ? `${formatSignedNumber(0.3)} kg/semaine` :
			goalSlug === 'perte-poids' ? `-${formatDisplayNumber(0.5)} kg/semaine` :
				`${formatSignedNumber(0.2)} kg/semaine`;

	const rewards = [
		{
			id: 'streak',
			title: `${trackingDashboard.weeklySummary.daysWithEntries}/7 jours actifs`,
			subtitle: trackingDashboard.weeklySummary.regularityLabel,
			tone: 'green',
		},
		{
			id: 'planner',
			title: `${plannerDashboard.summary.plannedMeals} repas planifiés`,
			subtitle: 'Semaine en cours',
			tone: 'blue',
		},
		{
			id: 'goal',
			title: weightGap > 0 ? `${formatDisplayNumber(weightGap)} kg restants` : 'Objectif atteint',
			subtitle: goalLabel,
			tone: 'amber',
		},
	];

	const caloriesAdjustment =
		goalSlug === 'prise-masse' ? '+300 kcal' :
			goalSlug === 'perte-poids' ? '-450 kcal' :
				'Plan équilibré';

	const todayDateLabel = new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(new Date(`${today}T12:00:00`));

	return {
		token: recipesCatalog.token,
		user: {
			firstName,
			fullName,
			avatarUrl,
			initials: `${String(user.prenom ?? '')[0] ?? ''}${String(user.nom ?? '')[0] ?? ''}`.toUpperCase() || 'NU',
			goalLabel,
			goalSlug,
			dietLabel,
			activityLabel,
			sessions,
			currentWeight,
			targetWeight,
		},
		today: {
			dateLabel: todayDateLabel,
			caloriesConsumed: trackingDashboard.selectedDay.caloriesConsumed,
			caloriesTarget,
			caloriesRemaining: Math.max(0, caloriesTarget - trackingDashboard.selectedDay.caloriesConsumed),
			proteinsConsumed: trackingDashboard.selectedDay.proteinsConsumed,
			proteinsTarget,
			carbsConsumed: trackingDashboard.selectedDay.carbsConsumed,
			carbsTarget,
			fatsConsumed: trackingDashboard.selectedDay.fatsConsumed,
			fatsTarget,
		},
		sportMode: {
			title: activityLabel,
			subtitle: `${goalLabel} · ${sessions} séance${sessions > 1 ? 's' : ''}/semaine`,
			proteinsPerKg: currentWeight > 0 ? round(proteinsTarget / currentWeight) : 0,
			calorieAdjustment: caloriesAdjustment,
			waterLiters: round(Math.max(1.8, currentWeight * 0.035)),
		},
		planningToday: todayPlanning,
		weekly: {
			averageCalories: trackingDashboard.weeklySummary.averageCalories,
			averageProteins: trackingDashboard.weeklySummary.averageProteins,
			averageCarbs: trackingDashboard.weeklySummary.averageCarbs,
			averageFats: trackingDashboard.weeklySummary.averageFats,
			complianceDays: trackingDashboard.weeklySummary.complianceDays,
			daysWithEntries: trackingDashboard.weeklySummary.daysWithEntries,
			proteinRate: trackingDashboard.weeklySummary.proteinRate,
			regularityLabel: trackingDashboard.weeklySummary.regularityLabel,
			regularityRate: trackingDashboard.weeklySummary.regularityRate,
			days: trackingDashboard.week.days,
		},
		goals: {
			calories: caloriesTarget,
			proteins: proteinsTarget,
			carbs: carbsTarget,
			fats: fatsTarget,
		},
		rewards,
		recommendedRecipes,
		products: [
			{
				id: 'whey-bio',
				brand: 'NutriMax Pro',
				title: 'Whey Protéine Bio',
				price: '39,99€',
				badge: 'Best-seller',
			},
			{
				id: 'omega-premium',
				brand: 'HealthFirst',
				title: 'Oméga 3 Premium',
				price: '24,99€',
				badge: '-15%',
			},
		],
		projection: {
			weeklyPace: weeklyPaceLabel,
			weightGap,
		},
	};
}

function formatSignedNumber(value: number) {
	const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.0', '');
	return value > 0 ? `+${formatted}` : formatted;
}

function formatDisplayNumber(value: number) {
	return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.0', '');
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

async function ensurePlannerCollections(token: string) {
	const [usersCollection, recipesCollection] = await Promise.all([
		getCollectionMeta('users', token),
		getCollectionMeta('recettes', token),
	]);

	await ensureBaseCollection(
		'planning_repas',
		[
			{
				name: 'user_id',
				type: 'relation',
				required: true,
				collectionId: usersCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'date_repas',
				type: 'date',
				required: true,
				min: '',
				max: '',
			},
			{
				name: 'type_repas',
				type: 'select',
				required: true,
				maxSelect: 1,
				values: [...plannerMealTypeOrder],
			},
			{
				name: 'recette_id',
				type: 'relation',
				required: true,
				collectionId: recipesCollection.id,
				cascadeDelete: false,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'portions',
				type: 'number',
				required: true,
				min: 0.5,
				max: 20,
				noDecimal: false,
			},
		],
		token,
	);
}

async function ensureFavoriteRecipeCollections(token: string) {
	const [usersCollection, recipesCollection] = await Promise.all([
		getCollectionMeta('users', token),
		getCollectionMeta('recettes', token),
	]);

	await ensureBaseCollection(
		'recettes_favorites',
		[
			{
				name: 'user_id',
				type: 'relation',
				required: true,
				collectionId: usersCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'recette_id',
				type: 'relation',
				required: true,
				collectionId: recipesCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
		],
		token,
	);
}

async function getFavoriteRecipeLinksForUser(userId: string, token: string) {
	await ensureFavoriteRecipeCollections(token);
	return listRecordsWithQuery<Record<string, any>>(
		'recettes_favorites',
		`perPage=400&filter=${encodeURIComponent(`user_id="${userId}"`)}&expand=recette_id`,
		token,
	);
}

export async function getFavoriteRecipesForUser(userToken: string) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	const links = await getFavoriteRecipeLinksForUser(String(refreshedAuth.record.id), adminToken);

	const recipes = await Promise.all(
		links
			.map((item) => item.expand?.recette_id)
			.filter(Boolean)
			.map(async (recipe: Record<string, any>) => ({
				id: String(recipe.id),
				slug: String(recipe.slug ?? ''),
				titre: String(recipe.titre ?? ''),
				description: String(recipe.description ?? ''),
				caloriesParPortion: Number(recipe.calories_par_portion ?? 0),
				tempsPreparationMin: Number(recipe.temps_preparation_min ?? 0),
				photoUrl: await getFileUrl('recettes', String(recipe.id), recipe.photo),
			})),
	);

	return {
		token: refreshedAuth.token,
		recipes,
	};
}

export async function toggleFavoriteRecipe(userToken: string, recipeId: string) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	const userId = String(refreshedAuth.record.id);
	const cleanRecipeId = String(recipeId ?? '').trim();
	if (!cleanRecipeId) {
		throw new Error('Recette favorite manquante.');
	}

	await ensureFavoriteRecipeCollections(adminToken);
	const existing = await listRecordsWithQuery<Record<string, any>>(
		'recettes_favorites',
		`perPage=10&filter=${encodeURIComponent(`user_id="${userId}" && recette_id="${cleanRecipeId}"`)}`,
		adminToken,
	);

	let isFavorite = false;
	if (existing[0]?.id) {
		await deleteRecord('recettes_favorites', String(existing[0].id), adminToken);
		isFavorite = false;
	} else {
		await createRecord(
			'recettes_favorites',
			{
				user_id: userId,
				recette_id: cleanRecipeId,
			},
			adminToken,
		);
		isFavorite = true;
	}

	const favoriteCount = (
		await listRecordsWithQuery<Record<string, any>>(
			'recettes_favorites',
			`perPage=500&filter=${encodeURIComponent(`recette_id="${cleanRecipeId}"`)}`,
			adminToken,
		)
	).length;

	return {
		token: refreshedAuth.token,
		isFavorite,
		favoriteCount,
	};
}

async function getUserPlannerEntries(userId: string, token: string) {
	return listRecordsWithQuery<Record<string, any>>(
		'planning_repas',
		`perPage=500&sort=date_repas&filter=${encodeURIComponent(`user_id="${userId}"`)}&expand=recette_id`,
		token,
	);
}

function getPlannerSuggestionScore(
	recipe: Record<string, any>,
	goals: { calories: number; proteins: number; carbs: number; fats: number },
	userRegimeId?: string,
) {
	let score = 0;
	const calories = Number(recipe.calories_par_portion ?? 0);
	const proteins = Number(recipe.proteines_par_portion_g ?? 0);

	if (goals.calories > 0) {
		score += Math.max(0, 1 - Math.abs(calories - goals.calories / 3) / Math.max(goals.calories / 3, 1));
	}
	score += proteins / 50;
	if (userRegimeId && String(recipe.regime_id ?? '') === userRegimeId) {
		score += 1.25;
	}
	return score;
}

export async function getMealPlannerDashboard(userToken: string, selectedDateInput?: string) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensurePlannerCollections(adminToken);

	const userId = String(refreshedAuth.record.id);
	const selectedDate = normalizeDateInput(selectedDateInput);
	const weekStart = getWeekStartDate(selectedDate);
	const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
	const weekDateKeys = weekDates.map((date) => date.toISOString().slice(0, 10));

	const [nutritionProfile, user, recipeCatalog, plannerEntries] = await Promise.all([
		getNutritionProfileByUserId(userId, adminToken),
		getUserRecordById(userId, adminToken),
		listRecordsWithQuery<Record<string, any>>(
			'recettes',
			'perPage=200&sort=-date_creation&filter=' + encodeURIComponent('is_published=true'),
			adminToken,
		),
		getUserPlannerEntries(userId, adminToken),
	]);

	const goals = {
		calories: Number(nutritionProfile?.calories_journalieres ?? 0),
		proteins: Number(nutritionProfile?.proteines_journalieres_g ?? 0),
		carbs: Number(nutritionProfile?.glucides_journaliers_g ?? 0),
		fats: Number(nutritionProfile?.lipides_journaliers_g ?? 0),
	};

	const weekEntries = plannerEntries.filter((entry) => weekDateKeys.includes(toDateOnly(entry.date_repas)));
	const entryBySlot = new Map<string, Record<string, any>>();
	for (const entry of weekEntries) {
		entryBySlot.set(`${toDateOnly(entry.date_repas)}:${entry.type_repas}`, entry);
	}

	const recipeSuggestions = await Promise.all(
		recipeCatalog
			.sort(
				(left, right) =>
					getPlannerSuggestionScore(right, goals, String(user.regime_id ?? '')) -
					getPlannerSuggestionScore(left, goals, String(user.regime_id ?? '')),
			)
			.slice(0, 18)
			.map(async (recipe) => ({
				id: String(recipe.id),
				title: String(recipe.titre ?? 'Recette'),
				calories: Number(recipe.calories_par_portion ?? 0),
				proteins: Number(recipe.proteines_par_portion_g ?? 0),
				carbs: Number(recipe.glucides_par_portion_g ?? 0),
				fats: Number(recipe.lipides_par_portion_g ?? 0),
				defaultPortions: Number(recipe.nombre_portions ?? 1),
				imageUrl: await getFileUrl('recettes', String(recipe.id), recipe.photo),
			})),
	);

	const days = await Promise.all(
		weekDateKeys.map(async (dateKey, index) => {
			const meals = await Promise.all(
				plannerMealTypeOrder.map(async (mealType) => {
					const entry = entryBySlot.get(`${dateKey}:${mealType}`);
					if (!entry?.expand?.recette_id) {
						return {
							mealType,
							mealLabel: plannerMealTypeLabels[mealType],
							entry: null,
						};
					}

					const recipe = entry.expand.recette_id;
					return {
						mealType,
						mealLabel: plannerMealTypeLabels[mealType],
						entry: {
							id: String(entry.id),
							date: dateKey,
							portions: Number(entry.portions ?? 1),
							recipeId: String(recipe.id),
							slug: String(recipe.slug ?? ''),
							title: String(recipe.titre ?? 'Recette'),
							calories: round(Number(recipe.calories_par_portion ?? 0) * Number(entry.portions ?? 1)),
							proteins: round(Number(recipe.proteines_par_portion_g ?? 0) * Number(entry.portions ?? 1)),
							carbs: round(Number(recipe.glucides_par_portion_g ?? 0) * Number(entry.portions ?? 1)),
							fats: round(Number(recipe.lipides_par_portion_g ?? 0) * Number(entry.portions ?? 1)),
							imageUrl: await getFileUrl('recettes', String(recipe.id), recipe.photo),
						},
					};
				}),
			);

			return {
				date: dateKey,
				label: new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(weekDates[index]),
				shortLabel: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(weekDates[index]).replace('.', ''),
				dayNumber: new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(weekDates[index]),
				totalCalories: round(meals.reduce((sum, item) => sum + Number(item.entry?.calories ?? 0), 0)),
				meals,
			};
		}),
	);

	const plannedMeals = days.reduce(
		(sum, day) => sum + day.meals.reduce((mealSum, meal) => mealSum + (meal.entry ? 1 : 0), 0),
		0,
	);
	const totalCalories = round(days.reduce((sum, day) => sum + day.totalCalories, 0));

	return {
		token: refreshedAuth.token,
		week: {
			start: weekDateKeys[0],
			end: weekDateKeys[6],
			label: formatWeekLabel(weekStart),
			days,
		},
		goals,
		summary: {
			totalCalories,
			plannedMeals,
			totalSlots: plannerMealTypeOrder.length * 7,
			averageCalories: round(totalCalories / 7),
			targetCalories: goals.calories,
		},
		suggestions: {
			recipes: recipeSuggestions,
		},
	};
}

export async function addPlannerEntry(
	userToken: string,
	data: {
		date: string;
		typeRepas: (typeof plannerMealTypeOrder)[number];
		recipeId: string;
		portions: number;
	},
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensurePlannerCollections(adminToken);

	const userId = String(refreshedAuth.record.id);
	const date = normalizeDateInput(data.date);
	const existingEntries = await getUserPlannerEntries(userId, adminToken);
	const existing = existingEntries.find(
		(item) => toDateOnly(item.date_repas) === date && String(item.type_repas) === data.typeRepas,
	);

	if (existing?.id) {
		await updateRecord(
			'planning_repas',
			String(existing.id),
			{
				recette_id: data.recipeId,
				portions: Math.max(0.5, Number(data.portions) || 1),
			},
			adminToken,
		);
	} else {
		await createRecord(
			'planning_repas',
			{
				user_id: userId,
				date_repas: toStartOfDayIso(date),
				type_repas: data.typeRepas,
				recette_id: data.recipeId,
				portions: Math.max(0.5, Number(data.portions) || 1),
			},
			adminToken,
		);
	}

	return getMealPlannerDashboard(refreshedAuth.token, date);
}

export async function removePlannerEntry(
	userToken: string,
	data: { entryId: string; date: string },
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensurePlannerCollections(adminToken);

	await deleteRecord('planning_repas', data.entryId, adminToken);
	return getMealPlannerDashboard(refreshedAuth.token, data.date);
}

export async function syncPlannerWeekToTracking(
	userToken: string,
	data: { weekStart: string },
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensurePlannerCollections(adminToken);

	const userId = String(refreshedAuth.record.id);
	const nutritionProfile = await getNutritionProfileByUserId(userId, adminToken);
	const goals = {
		calories: Number(nutritionProfile?.calories_journalieres ?? 0),
		proteins: Number(nutritionProfile?.proteines_journalieres_g ?? 0),
		carbs: Number(nutritionProfile?.glucides_journaliers_g ?? 0),
		fats: Number(nutritionProfile?.lipides_journaliers_g ?? 0),
	};

	const weekStart = getWeekStartDate(data.weekStart);
	const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
	const weekDateKeys = weekDates.map((date) => date.toISOString().slice(0, 10));
	const plannerEntries = (await getUserPlannerEntries(userId, adminToken)).filter((entry) =>
		weekDateKeys.includes(toDateOnly(entry.date_repas)),
	);

	const impactedSuiviIds = new Set<string>();

	for (const entry of plannerEntries) {
		const dateKey = toDateOnly(entry.date_repas);
		const trackingDay = await getOrCreateTrackingDayRecord(userId, dateKey, goals, adminToken);
		const suiviId = String(trackingDay.id);
		const recipeId = String(entry.recette_id);
		const mealType = String(entry.type_repas);
		const portions = Number(entry.portions ?? 1);
		const recipe = entry.expand?.recette_id ?? (await getRecordById('recettes', recipeId, adminToken));

		const existingMealEntries = await listRecordsWithQuery<Record<string, any>>(
			'repas_consommes',
			`perPage=50&filter=${encodeURIComponent(`suivi_id="${suiviId}" && type_repas="${mealType}"`)}`,
			adminToken,
		);

		for (const existing of existingMealEntries) {
			await deleteRecord('repas_consommes', String(existing.id), adminToken);
		}

		await createRecord(
			'repas_consommes',
			{
				suivi_id: suiviId,
				recette_id: recipeId,
				type_repas: mealType,
				portions_consommees: portions,
				calories_total: round(Number(recipe.calories_par_portion ?? 0) * portions),
				proteines_total_g: round(Number(recipe.proteines_par_portion_g ?? 0) * portions),
				glucides_total_g: round(Number(recipe.glucides_par_portion_g ?? 0) * portions),
				lipides_total_g: round(Number(recipe.lipides_par_portion_g ?? 0) * portions),
			},
			adminToken,
		);

		impactedSuiviIds.add(suiviId);
	}

	for (const suiviId of impactedSuiviIds) {
		await recomputeTrackingDayTotals(suiviId, goals, adminToken);
	}

	return getMealPlannerDashboard(refreshedAuth.token, data.weekStart);
}

async function ensureShoppingListCollections(token: string) {
	const [usersCollection, foodsCollection] = await Promise.all([
		getCollectionMeta('users', token),
		getCollectionMeta('aliments', token),
	]);

	await ensureBaseCollection(
		'liste_courses_items',
		[
			{
				name: 'user_id',
				type: 'relation',
				required: true,
				collectionId: usersCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'week_start',
				type: 'date',
				required: true,
				min: '',
				max: '',
			},
			{
				name: 'item_key',
				type: 'text',
				required: true,
				min: 1,
				max: 255,
			},
			{
				name: 'nom',
				type: 'text',
				required: true,
				min: 1,
				max: 255,
			},
			{
				name: 'categorie',
				type: 'text',
				required: false,
				min: 0,
				max: 80,
			},
			{
				name: 'quantite',
				type: 'number',
				required: false,
				min: 0,
				max: 100000,
				noDecimal: false,
			},
			{
				name: 'unite',
				type: 'text',
				required: false,
				min: 0,
				max: 40,
			},
			{
				name: 'is_checked',
				type: 'bool',
				required: false,
			},
			{
				name: 'is_hidden',
				type: 'bool',
				required: false,
			},
			{
				name: 'is_manual',
				type: 'bool',
				required: false,
			},
			{
				name: 'aliment_id',
				type: 'relation',
				required: false,
				collectionId: foodsCollection.id,
				cascadeDelete: false,
				minSelect: 0,
				maxSelect: 1,
			},
		],
		token,
	);
}

function normalizeShoppingCategory(value?: string) {
	const category = String(value ?? '').toLowerCase();
	const map: Record<string, string> = {
		poisson: 'Poissons',
		legume: 'Légumes',
		fruit: 'Fruits',
		cereale: 'Céréales',
		viande: 'Viandes',
		produit_laitier: 'Produits laitiers',
		epicerie: 'Épicerie',
		autre: 'Autres',
	};
	return map[category] ?? (category ? category[0].toUpperCase() + category.slice(1) : 'Autres');
}

function slugifyKey(value: string) {
	return String(value)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function formatShoppingQuantity(quantity: number, unit: string) {
	if (unit === 'g' && quantity >= 1000) {
		return `${round(quantity / 1000)} kg`;
	}
	if (unit === 'ml' && quantity >= 1000) {
		return `${round(quantity / 1000)} l`;
	}
	return `${round(quantity)} ${unit}`.trim();
}

async function getUserShoppingListOverrides(userId: string, weekStart: string, token: string) {
	return listRecordsWithQuery<Record<string, any>>(
		'liste_courses_items',
		`perPage=500&sort=nom&filter=${encodeURIComponent(`user_id="${userId}" && week_start~"${weekStart}"`)}&expand=aliment_id`,
		token,
	);
}

export async function getShoppingList(userToken: string, selectedDateInput?: string) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensurePlannerCollections(adminToken);
	await ensureShoppingListCollections(adminToken);

	const userId = String(refreshedAuth.record.id);
	const weekStartDate = getWeekStartDate(selectedDateInput);
	const weekStart = weekStartDate.toISOString().slice(0, 10);
	const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStartDate, index));
	const weekDateKeys = weekDates.map((date) => date.toISOString().slice(0, 10));

	const plannerEntries = (await getUserPlannerEntries(userId, adminToken)).filter((entry) =>
		weekDateKeys.includes(toDateOnly(entry.date_repas)),
	);

	const recipeIds = [...new Set(plannerEntries.map((entry) => String(entry.recette_id)))];
	const ingredientLinks = recipeIds.length
		? await listRecordsWithQuery<Record<string, any>>(
			'ingredients_recette',
			`perPage=800&sort=ordre&filter=${encodeURIComponent(recipeIds.map((id) => `recette_id="${id}"`).join(' || '))}&expand=aliment_id`,
			adminToken,
		)
		: [];

	const ingredientMapByRecipe = new Map<string, Array<Record<string, any>>>();
	for (const item of ingredientLinks) {
		const recipeId = String(item.recette_id);
		const list = ingredientMapByRecipe.get(recipeId) ?? [];
		list.push(item);
		ingredientMapByRecipe.set(recipeId, list);
	}

	const recipesById = new Map(plannerEntries.map((entry) => [String(entry.recette_id), entry.expand?.recette_id]));
	const aggregated = new Map<string, Record<string, any>>();

	for (const entry of plannerEntries) {
		const recipeId = String(entry.recette_id);
		const recipe = recipesById.get(recipeId) ?? {};
		const basePortions = Math.max(1, Number(recipe?.nombre_portions ?? 1));
		const ratio = Number(entry.portions ?? 1) / basePortions;
		const recipeIngredients = ingredientMapByRecipe.get(recipeId) ?? [];

		for (const ingredient of recipeIngredients) {
			const food = ingredient.expand?.aliment_id;
			const nom = String(food?.nom ?? ingredient.nom_affiche ?? 'Ingrédient');
			const unite = String(ingredient.unite ?? food?.unite_par_defaut ?? 'g');
			const categorie = normalizeShoppingCategory(food?.categorie);
			const quantite = Number(ingredient.quantite ?? 0) * ratio;
			const foodId = String(food?.id ?? '');
			const itemKey = `auto:${foodId || slugifyKey(nom)}:${unite}`;
			const existing = aggregated.get(itemKey);

			if (existing) {
				existing.quantite += quantite;
			} else {
				aggregated.set(itemKey, {
					itemKey,
					nom,
					categorie,
					quantite,
					unite,
					alimentId: foodId || null,
					isManual: false,
				});
			}
		}
	}

	const overrides = await getUserShoppingListOverrides(userId, weekStart, adminToken);
	const overrideByKey = new Map(overrides.map((item) => [String(item.item_key), item]));

	const generatedItems = Array.from(aggregated.values())
		.filter((item) => !Boolean(overrideByKey.get(item.itemKey)?.is_hidden))
		.map((item) => ({
			id: String(overrideByKey.get(item.itemKey)?.id ?? item.itemKey),
			itemKey: item.itemKey,
			nom: item.nom,
			categorie: item.categorie,
			quantite: round(item.quantite),
			unite: item.unite,
			displayQuantity: formatShoppingQuantity(round(item.quantite), item.unite),
			isChecked: Boolean(overrideByKey.get(item.itemKey)?.is_checked ?? false),
			isManual: false,
		}));

	const manualItems = overrides
		.filter((item) => Boolean(item.is_manual) && !Boolean(item.is_hidden))
		.map((item) => ({
			id: String(item.id),
			itemKey: String(item.item_key),
			nom: String(item.nom ?? 'Article'),
			categorie: normalizeShoppingCategory(String(item.categorie ?? 'autre')),
			quantite: Number(item.quantite ?? 0),
			unite: String(item.unite ?? ''),
			displayQuantity: formatShoppingQuantity(Number(item.quantite ?? 0), String(item.unite ?? '')),
			isChecked: Boolean(item.is_checked ?? false),
			isManual: true,
		}));

	const items = [...generatedItems, ...manualItems].sort((left, right) =>
		left.categorie.localeCompare(right.categorie, 'fr') || left.nom.localeCompare(right.nom, 'fr'),
	);

	const groupsMap = new Map<string, Array<Record<string, any>>>();
	for (const item of items) {
		const list = groupsMap.get(item.categorie) ?? [];
		list.push(item);
		groupsMap.set(item.categorie, list);
	}

	const groups = Array.from(groupsMap.entries()).map(([category, categoryItems]) => ({
		category,
		checkedCount: categoryItems.filter((item) => item.isChecked).length,
		totalCount: categoryItems.length,
		items: categoryItems,
	}));

	const checkedCount = items.filter((item) => item.isChecked).length;

	return {
		token: refreshedAuth.token,
		week: {
			start: weekStart,
			end: weekDateKeys[6],
			label: formatWeekLabel(weekStartDate),
		},
		progress: {
			checkedCount,
			totalCount: items.length,
			rate: items.length ? Math.round((checkedCount / items.length) * 100) : 0,
		},
		groups,
	};
}

export async function toggleShoppingListItem(
	userToken: string,
	data: { weekStart: string; itemKey: string; checked: boolean },
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureShoppingListCollections(adminToken);
	const userId = String(refreshedAuth.record.id);
	const weekStart = getWeekStartDate(data.weekStart).toISOString().slice(0, 10);
	const overrides = await getUserShoppingListOverrides(userId, weekStart, adminToken);
	const existing = overrides.find((item) => String(item.item_key) === data.itemKey);

	if (existing?.id) {
		await updateRecord('liste_courses_items', String(existing.id), { is_checked: Boolean(data.checked) }, adminToken);
	} else {
		await createRecord(
			'liste_courses_items',
			{
				user_id: userId,
				week_start: toStartOfDayIso(weekStart),
				item_key: data.itemKey,
				nom: data.itemKey,
				categorie: 'autre',
				quantite: 0,
				unite: '',
				is_checked: Boolean(data.checked),
				is_hidden: false,
				is_manual: false,
			},
			adminToken,
		);
	}

	return getShoppingList(refreshedAuth.token, weekStart);
}

export async function addManualShoppingListItem(
	userToken: string,
	data: { weekStart: string; nom: string; categorie: string; quantite: number; unite: string },
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureShoppingListCollections(adminToken);
	const userId = String(refreshedAuth.record.id);
	const weekStart = getWeekStartDate(data.weekStart).toISOString().slice(0, 10);
	const itemKey = `manual:${slugifyKey(data.nom)}:${Date.now()}`;

	await createRecord(
		'liste_courses_items',
		{
			user_id: userId,
			week_start: toStartOfDayIso(weekStart),
			item_key: itemKey,
			nom: String(data.nom).trim(),
			categorie: String(data.categorie || 'autre').trim(),
			quantite: Math.max(0, Number(data.quantite) || 0),
			unite: String(data.unite || '').trim(),
			is_checked: false,
			is_hidden: false,
			is_manual: true,
		},
		adminToken,
	);

	return getShoppingList(refreshedAuth.token, weekStart);
}

export async function removeShoppingListItem(
	userToken: string,
	data: { weekStart: string; itemKey: string },
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureShoppingListCollections(adminToken);
	const userId = String(refreshedAuth.record.id);
	const weekStart = getWeekStartDate(data.weekStart).toISOString().slice(0, 10);
	const overrides = await getUserShoppingListOverrides(userId, weekStart, adminToken);
	const existing = overrides.find((item) => String(item.item_key) === data.itemKey);

	if (existing?.id) {
		if (Boolean(existing.is_manual)) {
			await deleteRecord('liste_courses_items', String(existing.id), adminToken);
		} else {
			await updateRecord('liste_courses_items', String(existing.id), { is_hidden: true }, adminToken);
		}
	} else {
		await createRecord(
			'liste_courses_items',
			{
				user_id: userId,
				week_start: toStartOfDayIso(weekStart),
				item_key: data.itemKey,
				nom: data.itemKey,
				categorie: 'autre',
				quantite: 0,
				unite: '',
				is_checked: false,
				is_hidden: true,
				is_manual: false,
			},
			adminToken,
		);
	}

	return getShoppingList(refreshedAuth.token, weekStart);
}

function normalizeCommunityHashtags(value?: string) {
	const raw = String(value ?? '').trim();
	if (!raw) {
		return [] as string[];
	}

	const hashtagMatches = raw.match(/#[\p{L}\p{N}_-]+/gu) ?? [];
	const source = hashtagMatches.length
		? hashtagMatches.map((item) => item.replace(/^#/, ''))
		: raw.split(/[\s,;\n]+/g).map((item) => item.replace(/^#/, ''));

	return [...new Set(source.map((item) => slugifyKey(item)).filter(Boolean))].slice(0, 8);
}

function formatCommunityHashtagStorage(tags: string[]) {
	return tags.map((tag) => `#${tag}`).join(' ');
}

function getCommunityDisplayName(user?: Record<string, any> | null) {
	if (!user) {
		return 'Utilisateur';
	}

	const fullName = String(user.name ?? `${user.prenom ?? ''} ${user.nom ?? ''}`.trim()).trim();
	return fullName || String(user.email ?? 'Utilisateur');
}

function getCommunityInitials(user?: Record<string, any> | null) {
	if (!user) {
		return 'UT';
	}

	const prenom = String(user.prenom ?? '').trim();
	const nom = String(user.nom ?? '').trim();
	if (prenom || nom) {
		return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase() || 'UT';
	}

	const fallback = getCommunityDisplayName(user);
	const parts = fallback.split(/\s+/).filter(Boolean);
	return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() || 'UT';
}

async function resolveCommunityPostImage(post: Record<string, any>) {
	if (post.image) {
		const uploaded = await getFileUrl('communaute_posts', String(post.id), String(post.image));
		if (uploaded) {
			return uploaded;
		}
	}

	const external = String(post.image_url ?? '').trim();
	return external || null;
}

async function ensureCommunityCollections(token: string) {
	const [usersCollection, recipesCollection] = await Promise.all([
		getCollectionMeta('users', token),
		getCollectionMeta('recettes', token),
	]);

	await ensureBaseCollection(
		'communaute_posts',
		[
			{
				name: 'user_id',
				type: 'relation',
				required: true,
				collectionId: usersCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'description',
				type: 'text',
				required: true,
				min: 3,
				max: 4000,
			},
			{
				name: 'hashtags',
				type: 'text',
				required: false,
				min: 0,
				max: 500,
			},
			{
				name: 'image_url',
				type: 'text',
				required: false,
				min: 0,
				max: 2000,
			},
		],
		token,
	);

	const postsCollection = await ensureCollectionFields(
		'communaute_posts',
		[
			{
				name: 'recette_id',
				type: 'relation',
				required: false,
				collectionId: recipesCollection.id,
				cascadeDelete: false,
				minSelect: 0,
				maxSelect: 1,
			},
		],
		token,
	);

	await ensureBaseCollection(
		'communaute_post_likes',
		[
			{
				name: 'post_id',
				type: 'relation',
				required: true,
				collectionId: postsCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'user_id',
				type: 'relation',
				required: true,
				collectionId: usersCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
		],
		token,
	);

	await ensureBaseCollection(
		'communaute_commentaires',
		[
			{
				name: 'post_id',
				type: 'relation',
				required: true,
				collectionId: postsCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'user_id',
				type: 'relation',
				required: true,
				collectionId: usersCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'commentaire',
				type: 'text',
				required: true,
				min: 1,
				max: 1500,
			},
		],
		token,
	);

	const commentsCollection = await getCollectionMeta('communaute_commentaires', token);

	await ensureBaseCollection(
		'communaute_comment_likes',
		[
			{
				name: 'comment_id',
				type: 'relation',
				required: true,
				collectionId: commentsCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'user_id',
				type: 'relation',
				required: true,
				collectionId: usersCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
		],
		token,
	);
}

async function seedCommunityFeedIfEmpty(token: string) {
	const existingPosts = await listRecordsWithQuery<Record<string, any>>('communaute_posts', 'perPage=1', token);
	if (existingPosts.length > 0) {
		return;
	}

	const [users, recipes] = await Promise.all([
		listRecordsWithQuery<Record<string, any>>('users', 'perPage=20', token),
		listRecordsWithQuery<Record<string, any>>(
			'recettes',
			'perPage=6&sort=-date_creation&filter=' + encodeURIComponent('is_published=true'),
			token,
		),
	]);

	if (!users.length) {
		return;
	}

	const sampleDescriptions = [
		"Premier service complet avec Nutrivia. J'ai réussi à tenir mon objectif de la semaine grâce au suivi et au planificateur.",
		"Mon bowl préféré du moment : simple, rassasiant et parfait pour bien démarrer la journée.",
		"Recette testée ce midi, très bon équilibre entre protéines et légumes. Je la garde dans mon planning.",
		"Salade fraîche et rapide à préparer. Idéale quand on veut manger léger sans sacrifier le goût.",
		"Petit rappel : penser à ajuster les portions change vraiment les macros de la journée.",
	];
	const sampleTags = [
		['motivation', 'suivi'],
		['breakfast', 'proteines'],
		['mealprep', 'recette'],
		['healthy', 'equilibre'],
		['astuce', 'nutrition'],
	];
	const createdPosts: Array<Record<string, any>> = [];

	for (let index = 0; index < Math.min(5, Math.max(recipes.length, 1)); index += 1) {
		const recipe = recipes[index] ?? recipes[0] ?? null;
		const user = users[index % users.length];
		const imageUrl = recipe ? await getFileUrl('recettes', String(recipe.id), recipe.photo) : null;
		const created = await createRecord(
			'communaute_posts',
			{
				user_id: String(user.id),
				description: recipe
					? `${sampleDescriptions[index] ?? sampleDescriptions[0]} ${String(recipe.titre ?? '').trim()} reste l'une de mes recettes du moment.`
					: sampleDescriptions[index] ?? sampleDescriptions[0],
				hashtags: formatCommunityHashtagStorage(sampleTags[index] ?? sampleTags[0]),
				image_url: imageUrl ?? '',
			},
			token,
		);
		createdPosts.push(created as Record<string, any>);
	}

	const sampleComments = [
		'Merci pour le partage, ça donne envie de tester.',
		'Je confirme, cette recette fonctionne super bien en meal prep.',
		'Belle assiette, très inspirant pour la semaine.',
	];

	for (let index = 0; index < createdPosts.length; index += 1) {
		const post = createdPosts[index];
		const likeUsers = users.slice(0, Math.min(users.length, index + 2));
		for (const user of likeUsers) {
			await createRecord(
				'communaute_post_likes',
				{
					post_id: String(post.id),
					user_id: String(user.id),
				},
				token,
			);
		}

		if (index < 3 && users.length > 1) {
			const commenter = users[(index + 1) % users.length];
			const createdComment = (await createRecord(
				'communaute_commentaires',
				{
					post_id: String(post.id),
					user_id: String(commenter.id),
					commentaire: sampleComments[index] ?? sampleComments[0],
				},
				token,
			)) as Record<string, any>;

			await createRecord(
				'communaute_comment_likes',
				{
					comment_id: String(createdComment.id),
					user_id: String(users[0].id),
				},
				token,
			);
		}
	}
}

async function buildCommunityFeedPayload(
	currentUserId: string,
	viewer: Record<string, any>,
	token: string,
	sortMode: 'recent' | 'popular',
) {
	const [posts, comments, postLikes, commentLikes] = await Promise.all([
		listRecordsWithQuery<Record<string, any>>('communaute_posts', 'perPage=100&expand=user_id,recette_id', token),
		listRecordsWithQuery<Record<string, any>>('communaute_commentaires', 'perPage=300&expand=user_id,post_id', token),
		listRecordsWithQuery<Record<string, any>>('communaute_post_likes', 'perPage=1000', token),
		listRecordsWithQuery<Record<string, any>>('communaute_comment_likes', 'perPage=1000', token),
	]);

	const recipeSuggestions = await Promise.all(
		(
			await listRecordsWithQuery<Record<string, any>>(
				'recettes',
				'perPage=60&sort=-date_creation&filter=' + encodeURIComponent('is_published=true'),
				token,
			)
		).map(async (recipe) => ({
			id: String(recipe.id),
			title: String(recipe.titre ?? 'Recette'),
			slug: String(recipe.slug ?? ''),
			imageUrl: await getFileUrl('recettes', String(recipe.id), recipe.photo),
			calories: Number(recipe.calories_par_portion ?? 0),
			duration: Number(recipe.temps_preparation_min ?? 0),
		})),
	);

	const postLikesByPost = new Map<string, Array<Record<string, any>>>();
	for (const item of postLikes) {
		const key = String(item.post_id);
		const list = postLikesByPost.get(key) ?? [];
		list.push(item);
		postLikesByPost.set(key, list);
	}

	const commentLikesByComment = new Map<string, Array<Record<string, any>>>();
	for (const item of commentLikes) {
		const key = String(item.comment_id);
		const list = commentLikesByComment.get(key) ?? [];
		list.push(item);
		commentLikesByComment.set(key, list);
	}

	const commentsByPost = new Map<string, Array<Record<string, any>>>();
	for (const comment of comments) {
		const key = String(comment.post_id);
		const list = commentsByPost.get(key) ?? [];
		list.push(comment);
		commentsByPost.set(key, list);
	}

	const feedPosts = await Promise.all(
		posts.map(async (post) => {
			const likes = postLikesByPost.get(String(post.id)) ?? [];
			const postComments = commentsByPost.get(String(post.id)) ?? [];
			const imageUrl = await resolveCommunityPostImage(post);

			const mappedComments = await Promise.all(
				postComments.map(async (comment) => {
					const author = comment.expand?.user_id ?? null;
					const likesForComment = commentLikesByComment.get(String(comment.id)) ?? [];
					return {
						id: String(comment.id),
						content: String(comment.commentaire ?? ''),
						createdAt: String(comment.created ?? ''),
						likeCount: likesForComment.length,
						isLiked: likesForComment.some((item) => String(item.user_id) === currentUserId),
						author: {
							id: String(author?.id ?? ''),
							name: getCommunityDisplayName(author),
							initials: getCommunityInitials(author),
							avatarUrl: await getFileUrl('users', String(author?.id ?? ''), author?.avatar),
						},
					};
				}),
			);
			mappedComments.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

			const author = post.expand?.user_id ?? null;
			const linkedRecipe = post.expand?.recette_id ?? null;
			return {
				id: String(post.id),
				description: String(post.description ?? ''),
				hashtags: normalizeCommunityHashtags(String(post.hashtags ?? '')),
				imageUrl,
				createdAt: String(post.created ?? ''),
				likeCount: likes.length,
				commentCount: mappedComments.length,
				isLiked: likes.some((item) => String(item.user_id) === currentUserId),
				author: {
					id: String(author?.id ?? ''),
					name: getCommunityDisplayName(author),
					initials: getCommunityInitials(author),
					avatarUrl: await getFileUrl('users', String(author?.id ?? ''), author?.avatar),
				},
				linkedRecipe: linkedRecipe
					? {
						id: String(linkedRecipe.id),
						title: String(linkedRecipe.titre ?? 'Recette'),
						slug: String(linkedRecipe.slug ?? ''),
						calories: Number(linkedRecipe.calories_par_portion ?? 0),
						duration: Number(linkedRecipe.temps_preparation_min ?? 0),
						imageUrl: await getFileUrl('recettes', String(linkedRecipe.id), linkedRecipe.photo),
					}
					: null,
				comments: mappedComments,
			};
		}),
	);

	feedPosts.sort((left, right) => {
		if (sortMode === 'popular') {
			return (
				right.likeCount - left.likeCount ||
				right.commentCount - left.commentCount ||
				new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
			);
		}

		return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
	});

	return {
		viewer: {
			id: String(viewer.id),
			name: getCommunityDisplayName(viewer),
			initials: getCommunityInitials(viewer),
			avatarUrl: await getFileUrl('users', String(viewer.id), viewer.avatar),
		},
		composer: {
			recipes: recipeSuggestions,
		},
		sort: sortMode,
		posts: feedPosts,
	};
}

export async function getCommunityFeed(userToken: string, sortMode: 'recent' | 'popular' = 'recent') {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureCommunityCollections(adminToken);
	await seedCommunityFeedIfEmpty(adminToken);

	const viewer = await getUserRecordById(String(refreshedAuth.record.id), adminToken);
	const payload = await buildCommunityFeedPayload(String(refreshedAuth.record.id), viewer, adminToken, sortMode);

	return {
		token: refreshedAuth.token,
		...payload,
	};
}

export async function createCommunityPost(
	userToken: string,
	data: { description: string; hashtags?: string; image?: File | null; imageDataUrl?: string; recipeId?: string; sortMode?: 'recent' | 'popular' },
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureCommunityCollections(adminToken);

	const description = String(data.description ?? '').trim();
	if (description.length < 3) {
		throw new Error('Votre publication doit contenir au moins 3 caractères.');
	}

	const hashtags = normalizeCommunityHashtags(data.hashtags);
	const formData = new FormData();
	formData.set('user_id', String(refreshedAuth.record.id));
	formData.set('description', description);
	formData.set('hashtags', formatCommunityHashtagStorage(hashtags));
	if (String(data.recipeId ?? '').trim()) {
		formData.set('recette_id', String(data.recipeId).trim());
	}

	if (data.image instanceof File && data.image.size > 0) {
		formData.set('image', data.image);
	} else if (String(data.imageDataUrl ?? '').trim()) {
		formData.set('image_url', String(data.imageDataUrl ?? '').trim());
	}

	await createRecord('communaute_posts', formData, adminToken);
	return getCommunityFeed(refreshedAuth.token, data.sortMode ?? 'recent');
}

export async function toggleCommunityPostLike(
	userToken: string,
	data: { postId: string; sortMode?: 'recent' | 'popular' },
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureCommunityCollections(adminToken);

	const currentUserId = String(refreshedAuth.record.id);
	const existing = await listRecordsWithQuery<Record<string, any>>(
		'communaute_post_likes',
		`perPage=1&filter=${encodeURIComponent(`post_id="${data.postId}" && user_id="${currentUserId}"`)}`,
		adminToken,
	);

	if (existing[0]?.id) {
		await deleteRecord('communaute_post_likes', String(existing[0].id), adminToken);
	} else {
		await createRecord(
			'communaute_post_likes',
			{
				post_id: data.postId,
				user_id: currentUserId,
			},
			adminToken,
		);
	}

	return getCommunityFeed(refreshedAuth.token, data.sortMode ?? 'recent');
}

export async function addCommunityComment(
	userToken: string,
	data: { postId: string; commentaire: string; sortMode?: 'recent' | 'popular' },
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureCommunityCollections(adminToken);

	const commentaire = String(data.commentaire ?? '').trim();
	if (!commentaire) {
		throw new Error('Le commentaire ne peut pas être vide.');
	}

	await createRecord(
		'communaute_commentaires',
		{
			post_id: data.postId,
			user_id: String(refreshedAuth.record.id),
			commentaire,
		},
		adminToken,
	);

	return getCommunityFeed(refreshedAuth.token, data.sortMode ?? 'recent');
}

export async function toggleCommunityCommentLike(
	userToken: string,
	data: { commentId: string; sortMode?: 'recent' | 'popular' },
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureCommunityCollections(adminToken);

	const currentUserId = String(refreshedAuth.record.id);
	const existing = await listRecordsWithQuery<Record<string, any>>(
		'communaute_comment_likes',
		`perPage=1&filter=${encodeURIComponent(`comment_id="${data.commentId}" && user_id="${currentUserId}"`)}`,
		adminToken,
	);

	if (existing[0]?.id) {
		await deleteRecord('communaute_comment_likes', String(existing[0].id), adminToken);
	} else {
		await createRecord(
			'communaute_comment_likes',
			{
				comment_id: data.commentId,
				user_id: currentUserId,
			},
			adminToken,
		);
	}

	return getCommunityFeed(refreshedAuth.token, data.sortMode ?? 'recent');
}

function sortByCreatedAsc<T extends Record<string, any>>(items: T[]) {
	return [...items].sort(
		(left, right) => new Date(String(left.created ?? left.date_creation ?? 0)).getTime() - new Date(String(right.created ?? right.date_creation ?? 0)).getTime(),
	);
}

function sortByCreatedDesc<T extends Record<string, any>>(items: T[]) {
	return [...items].sort(
		(left, right) => new Date(String(right.created ?? right.date_creation ?? 0)).getTime() - new Date(String(left.created ?? left.date_creation ?? 0)).getTime(),
	);
}

function buildAssistantWelcomeMessage(firstName: string) {
	return `Bonjour ${firstName} ! Je suis Nutriv’IA. Je peux vous aider avec des recettes personnalisées, des conseils nutritionnels, la planification de vos repas et l’analyse de vos habitudes. Comment puis-je vous aider aujourd’hui ?`;
}

function buildAssistantStarterChips() {
	return [
		'Suggère-moi un menu pour la semaine',
		'Je veux une recette riche en protéines',
		'Comment atteindre mes objectifs plus rapidement ?',
		'Analyse mes habitudes alimentaires',
	];
}

async function ensureAssistantCollections(token: string) {
	const usersCollection = await getCollectionMeta('users', token);

	await ensureBaseCollection(
		'assistant_conversations',
		[
			{
				name: 'user_id',
				type: 'relation',
				required: true,
				collectionId: usersCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'titre',
				type: 'text',
				required: true,
				min: 1,
				max: 180,
			},
			{
				name: 'resume',
				type: 'text',
				required: false,
				min: 0,
				max: 400,
			},
		],
		token,
	);

	const conversationsCollection = await getCollectionMeta('assistant_conversations', token);

	await ensureBaseCollection(
		'assistant_messages',
		[
			{
				name: 'conversation_id',
				type: 'relation',
				required: true,
				collectionId: conversationsCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'role',
				type: 'select',
				required: true,
				maxSelect: 1,
				values: ['user', 'assistant'],
			},
			{
				name: 'content',
				type: 'text',
				required: true,
				min: 1,
				max: 12000,
			},
			{
				name: 'metadata_json',
				type: 'text',
				required: false,
				min: 0,
				max: 8000,
			},
		],
		token,
	);
}

function parseAssistantMetadata(value: unknown) {
	if (!value) return {};
	try {
		return JSON.parse(String(value)) as Record<string, any>;
	} catch {
		return {};
	}
}

async function getLatestAssistantConversation(userId: string, token: string) {
	const conversations = await listRecordsWithQuery<Record<string, any>>(
		'assistant_conversations',
		`perPage=200&filter=${encodeURIComponent(`user_id="${userId}"`)}`,
		token,
	);
	return sortByCreatedDesc(conversations)[0] ?? null;
}

async function getAssistantMessages(conversationId: string, token: string) {
	const messages = await listRecordsWithQuery<Record<string, any>>(
		'assistant_messages',
		`perPage=400&filter=${encodeURIComponent(`conversation_id="${conversationId}"`)}`,
		token,
	);
	return sortByCreatedAsc(messages);
}

async function createAssistantConversationForUser(user: Record<string, any>, token: string) {
	const firstName = String(user.prenom || user.name || 'Utilisateur').trim().split(' ')[0];
	const conversation = (await createRecord(
		'assistant_conversations',
		{
			user_id: String(user.id),
			titre: `Conversation de ${firstName}`,
			resume: 'Bienvenue dans votre assistant nutritionnel',
		},
		token,
	)) as Record<string, any>;

	await createRecord(
		'assistant_messages',
		{
			conversation_id: String(conversation.id),
			role: 'assistant',
			content: buildAssistantWelcomeMessage(firstName),
			metadata_json: JSON.stringify({
				chips: buildAssistantStarterChips(),
			}),
		},
		token,
	);

	return conversation;
}

function mapAssistantMessage(message: Record<string, any>) {
	return {
		id: String(message.id),
		role: String(message.role),
		content: String(message.content ?? ''),
		createdAt: String(message.created ?? ''),
		metadata: parseAssistantMetadata(message.metadata_json),
	};
}

export async function getAssistantWorkspace(userToken: string) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureAssistantCollections(adminToken);

	const user = await getUserRecordById(String(refreshedAuth.record.id), adminToken);
	const avatarUrl = await getFileUrl('users', String(user.id), user.avatar);
	let conversation = await getLatestAssistantConversation(String(user.id), adminToken);

	if (!conversation) {
		conversation = await createAssistantConversationForUser(user, adminToken);
	}

	const messages = await getAssistantMessages(String(conversation.id), adminToken);

	return {
		token: refreshedAuth.token,
		viewer: {
			id: String(user.id),
			firstName: String(user.prenom || user.name || 'Utilisateur').trim().split(' ')[0],
			fullName: String(`${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.name || 'Utilisateur'),
			avatarUrl,
			initials: `${String(user.prenom ?? '')[0] ?? ''}${String(user.nom ?? '')[0] ?? ''}`.toUpperCase() || 'NU',
		},
		conversation: {
			id: String(conversation.id),
			title: String(conversation.titre ?? 'Conversation'),
		},
		messages: messages.map(mapAssistantMessage),
		quickActions: [
			{ id: 'quick-recipe', label: 'Recette rapide', prompt: 'Propose-moi une recette rapide adaptée à mon profil.' },
			{ id: 'quick-menu', label: 'Menu semaine', prompt: 'Prépare-moi un menu simple pour les 7 prochains jours.' },
			{ id: 'quick-substitution', label: 'Substitution', prompt: 'Aide-moi à remplacer un ingrédient dans une recette.' },
			{ id: 'quick-weight', label: 'Conseil perte de poids', prompt: 'Quels conseils concrets me donner pour progresser vers mon objectif ?' },
		],
		faqs: [
			'Quels aliments sont riches en fer ?',
			'Comment calculer mes besoins en protéines ?',
			'Quelle collation prendre avant le sport ?',
			'Comment réduire ma consommation de sucre ?',
			'Quels sont les bénéfices du régime méditerranéen ?',
			'Comment éviter les fringales en fin de journée ?',
		],
		recommendation: {
			title: 'Guide complet nutrition 2026',
			description: 'Tout savoir sur l’alimentation saine et équilibrée - format digital + 200 recettes',
			price: '19,99€',
		},
	};
}

export async function saveAssistantConversationTurn(
	userToken: string,
	data: {
		conversationId?: string;
		userMessage: string;
		assistantMessage: string;
		assistantMetadata?: Record<string, any>;
	},
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureAssistantCollections(adminToken);

	const user = await getUserRecordById(String(refreshedAuth.record.id), adminToken);
	let conversation =
		data.conversationId
			? await getRecordById('assistant_conversations', String(data.conversationId), adminToken)
			: await getLatestAssistantConversation(String(user.id), adminToken);

	if (!conversation?.id) {
		conversation = await createAssistantConversationForUser(user, adminToken);
	}

	await createRecord(
		'assistant_messages',
		{
			conversation_id: String(conversation.id),
			role: 'user',
			content: String(data.userMessage).trim(),
			metadata_json: '',
		},
		adminToken,
	);

	await createRecord(
		'assistant_messages',
		{
			conversation_id: String(conversation.id),
			role: 'assistant',
			content: String(data.assistantMessage).trim(),
			metadata_json: JSON.stringify(data.assistantMetadata ?? {}),
		},
		adminToken,
	);

	const preview = String(data.userMessage).trim().slice(0, 120);
	await updateRecord(
		'assistant_conversations',
		String(conversation.id),
		{
			titre: preview.slice(0, 60) || String(conversation.titre ?? 'Conversation'),
			resume: preview,
		},
		adminToken,
	);

	const messages = await getAssistantMessages(String(conversation.id), adminToken);
	return {
		token: refreshedAuth.token,
		conversation: {
			id: String(conversation.id),
			title: preview.slice(0, 60) || String(conversation.titre ?? 'Conversation'),
		},
		messages: messages.map(mapAssistantMessage),
	};
}

const nutritionProfessionalSeeds = [
	{
		slug: 'claire-martin-dieteticienne',
		nom_affiche: 'Claire Martin',
		specialite: 'dieteticien',
		description:
			'Diététicienne spécialisée en rééquilibrage alimentaire, perte de poids durable et organisation des repas du quotidien.',
		experience_annees: 9,
		ville: 'Paris',
		tarif_consultation: 55,
		modes_consultation: 'cabinet,visio',
	},
	{
		slug: 'yanis-belkacem-nutrition-sportive',
		nom_affiche: 'Yanis Belkacem',
		specialite: 'nutritionniste_sportif',
		description:
			'Expert en nutrition sportive pour la prise de masse, la performance et la récupération chez les sportifs réguliers.',
		experience_annees: 6,
		ville: 'Lyon',
		tarif_consultation: 65,
		modes_consultation: 'visio',
	},
	{
		slug: 'sarah-lefevre-coach-alimentaire',
		nom_affiche: 'Sarah Lefèvre',
		specialite: 'coach_alimentaire',
		description:
			'Coach alimentaire orientée habitudes durables, gestion des fringales et planification simple des repas en famille.',
		experience_annees: 7,
		ville: 'Bordeaux',
		tarif_consultation: 49,
		modes_consultation: 'cabinet,visio',
	},
] as const;

function getProfessionalSpecialityLabel(value?: string) {
	const labels: Record<string, string> = {
		dieteticien: 'Diététicien',
		nutritionniste: 'Nutritionniste',
		nutritionniste_sportif: 'Nutrition sportive',
		coach_alimentaire: 'Coach alimentaire',
	};
	return labels[String(value ?? '')] ?? 'Professionnel nutrition';
}

function formatAppointmentDateLabel(value: string) {
	return new Intl.DateTimeFormat('fr-FR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(new Date(value));
}

function formatAppointmentTimeLabel(value: string) {
	return new Intl.DateTimeFormat('fr-FR', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

function toIsoDateTime(date: string, time: string) {
	return new Date(`${date}T${time}:00`).toISOString();
}

function hasTimeOverlap(
	startA: string,
	endA: string,
	startB: string,
	endB: string,
) {
	const aStart = new Date(startA).getTime();
	const aEnd = new Date(endA).getTime();
	const bStart = new Date(startB).getTime();
	const bEnd = new Date(endB).getTime();
	return aStart < bEnd && bStart < aEnd;
}

async function ensureProfessionalCollections(token: string) {
	const usersCollection = await getCollectionMeta('users', token);

	await ensureCollectionFields(
		'users',
		[
			{
				name: 'role',
				type: 'select',
				required: false,
				maxSelect: 1,
				values: ['user', 'professionnel'],
			},
		],
		token,
	);

	await ensureBaseCollection(
		'nutrition_professionnels',
		[
			{
				name: 'user_id',
				type: 'relation',
				required: false,
				collectionId: usersCollection.id,
				cascadeDelete: true,
				minSelect: 0,
				maxSelect: 1,
			},
			{
				name: 'slug',
				type: 'text',
				required: true,
				min: 1,
				max: 160,
			},
			{
				name: 'nom_affiche',
				type: 'text',
				required: true,
				min: 1,
				max: 140,
			},
			{
				name: 'specialite',
				type: 'select',
				required: true,
				maxSelect: 1,
				values: ['dieteticien', 'nutritionniste', 'nutritionniste_sportif', 'coach_alimentaire'],
			},
			{
				name: 'description',
				type: 'text',
				required: true,
				min: 1,
				max: 4000,
			},
			{
				name: 'experience_annees',
				type: 'number',
				required: false,
				min: 0,
				max: 60,
				noDecimal: true,
			},
			{
				name: 'ville',
				type: 'text',
				required: false,
				min: 0,
				max: 160,
			},
			{
				name: 'tarif_consultation',
				type: 'number',
				required: false,
				min: 0,
				max: 999,
				noDecimal: false,
			},
			{
				name: 'modes_consultation',
				type: 'text',
				required: false,
				min: 0,
				max: 200,
			},
			{
				name: 'is_active',
				type: 'bool',
				required: false,
			},
		],
		token,
	);

	const professionalsCollection = await getCollectionMeta('nutrition_professionnels', token);

	await ensureBaseCollection(
		'nutrition_disponibilites',
		[
			{
				name: 'professionnel_id',
				type: 'relation',
				required: true,
				collectionId: professionalsCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'debut_at',
				type: 'date',
				required: true,
			},
			{
				name: 'fin_at',
				type: 'date',
				required: true,
			},
			{
				name: 'notes',
				type: 'text',
				required: false,
				min: 0,
				max: 400,
			},
		],
		token,
	);

	const availabilitiesCollection = await getCollectionMeta('nutrition_disponibilites', token);

	await ensureBaseCollection(
		'nutrition_rendezvous',
		[
			{
				name: 'professionnel_id',
				type: 'relation',
				required: true,
				collectionId: professionalsCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'user_id',
				type: 'relation',
				required: true,
				collectionId: usersCollection.id,
				cascadeDelete: true,
				minSelect: 1,
				maxSelect: 1,
			},
			{
				name: 'disponibilite_id',
				type: 'relation',
				required: false,
				collectionId: availabilitiesCollection.id,
				cascadeDelete: false,
				minSelect: 0,
				maxSelect: 1,
			},
			{
				name: 'debut_at',
				type: 'date',
				required: true,
			},
			{
				name: 'fin_at',
				type: 'date',
				required: true,
			},
			{
				name: 'statut',
				type: 'select',
				required: true,
				maxSelect: 1,
				values: ['confirme', 'annule'],
			},
			{
				name: 'motif',
				type: 'text',
				required: false,
				min: 0,
				max: 1000,
			},
			{
				name: 'user_nom_snapshot',
				type: 'text',
				required: false,
				min: 0,
				max: 180,
			},
			{
				name: 'user_email_snapshot',
				type: 'text',
				required: false,
				min: 0,
				max: 180,
			},
		],
		token,
	);
}

async function seedProfessionalsIfEmpty(token: string) {
	await ensureProfessionalCollections(token);
	const existing = await listRecordsWithQuery<Record<string, any>>(
		'nutrition_professionnels',
		'perPage=100',
		token,
	);

	if (existing.length === 0) {
		for (const seed of nutritionProfessionalSeeds) {
			await createRecord(
				'nutrition_professionnels',
				{
					...seed,
					is_active: true,
				},
				token,
			);
		}
	}

	const professionals = await listRecordsWithQuery<Record<string, any>>(
		'nutrition_professionnels',
		'perPage=100',
		token,
	);
	const availabilities = await listRecordsWithQuery<Record<string, any>>(
		'nutrition_disponibilites',
		'perPage=300',
		token,
	);

	if (availabilities.length > 0) {
		return;
	}

	for (const professional of professionals.slice(0, 3)) {
		for (let dayOffset = 1; dayOffset <= 10; dayOffset += 1) {
			const baseDate = addDays(new Date(), dayOffset);
			const dateKey = baseDate.toISOString().slice(0, 10);
			const slots = ['09:00', '11:00', '14:00'];
			for (const time of slots) {
				const startAt = toIsoDateTime(dateKey, time);
				const endDate = new Date(startAt);
				endDate.setMinutes(endDate.getMinutes() + 45);
				await createRecord(
					'nutrition_disponibilites',
					{
						professionnel_id: String(professional.id),
						debut_at: startAt,
						fin_at: endDate.toISOString(),
						notes: '',
					},
					token,
				);
			}
		}
	}
}

function buildProfessionalCard(professional: Record<string, any>) {
	const firstName = String(professional.nom_affiche ?? '').trim().split(' ')[0] || 'Pro';
	return {
		id: String(professional.id),
		slug: String(professional.slug ?? ''),
		name: String(professional.nom_affiche ?? ''),
		firstName,
		initials: firstName.slice(0, 2).toUpperCase(),
		speciality: String(professional.specialite ?? ''),
		specialityLabel: getProfessionalSpecialityLabel(professional.specialite),
		description: String(professional.description ?? ''),
		experienceYears: Number(professional.experience_annees ?? 0),
		city: String(professional.ville ?? ''),
		price: Number(professional.tarif_consultation ?? 0),
		consultationModes: String(professional.modes_consultation ?? '')
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean),
		isActive: Boolean(professional.is_active ?? true),
	};
}

export async function getProfessionalsCatalog(selectedSpeciality?: string) {
	const adminToken = await authenticatePocketBaseAdmin();
	await seedProfessionalsIfEmpty(adminToken);

	const professionals = await listRecordsWithQuery<Record<string, any>>(
		'nutrition_professionnels',
		`perPage=200&filter=${encodeURIComponent('is_active=true')}`,
		adminToken,
	);

	const items = professionals
		.map(buildProfessionalCard)
		.filter((item) => !selectedSpeciality || item.speciality === selectedSpeciality);

	const specialities = [
		{ slug: '', label: 'Tous' },
		{ slug: 'dieteticien', label: getProfessionalSpecialityLabel('dieteticien') },
		{ slug: 'nutritionniste', label: getProfessionalSpecialityLabel('nutritionniste') },
		{ slug: 'nutritionniste_sportif', label: getProfessionalSpecialityLabel('nutritionniste_sportif') },
		{ slug: 'coach_alimentaire', label: getProfessionalSpecialityLabel('coach_alimentaire') },
	];

	return {
		professionals: items,
		filters: specialities,
		selectedSpeciality: selectedSpeciality ?? '',
	};
}

export async function getProfessionalDetail(slug: string) {
	const adminToken = await authenticatePocketBaseAdmin();
	await seedProfessionalsIfEmpty(adminToken);

	const items = await listRecordsWithQuery<Record<string, any>>(
		'nutrition_professionnels',
		`perPage=1&filter=${encodeURIComponent(`slug="${slug}" && is_active=true`)}`,
		adminToken,
	);
	const professional = items[0];
	if (!professional) {
		throw new Error('Professionnel introuvable.');
	}

	const [availabilities, appointments] = await Promise.all([
		listRecordsWithQuery<Record<string, any>>(
			'nutrition_disponibilites',
			`perPage=500&filter=${encodeURIComponent(`professionnel_id="${professional.id}"`)}`,
			adminToken,
		),
		listRecordsWithQuery<Record<string, any>>(
			'nutrition_rendezvous',
			`perPage=500&filter=${encodeURIComponent(`professionnel_id="${professional.id}" && statut="confirme"`)}`,
			adminToken,
		),
	]);

	const futureAvailabilities = sortByCreatedAsc(
		availabilities.filter((slot) => new Date(String(slot.debut_at)).getTime() > Date.now()),
	).filter(
		(slot) =>
			!appointments.some((appointment) =>
				hasTimeOverlap(
					String(slot.debut_at),
					String(slot.fin_at),
					String(appointment.debut_at),
					String(appointment.fin_at),
				),
			),
	);

	return {
		professional: buildProfessionalCard(professional),
		availabilities: futureAvailabilities.slice(0, 20).map((slot) => ({
			id: String(slot.id),
			startAt: String(slot.debut_at),
			endAt: String(slot.fin_at),
			dateLabel: formatAppointmentDateLabel(String(slot.debut_at)),
			timeLabel: `${formatAppointmentTimeLabel(String(slot.debut_at))} - ${formatAppointmentTimeLabel(String(slot.fin_at))}`,
		})),
	};
}

export async function bookProfessionalAppointment(
	userToken: string,
	data: {
		professionalId: string;
		availabilityId: string;
		motif?: string;
	},
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureProfessionalCollections(adminToken);

	const user = await getUserRecordById(String(refreshedAuth.record.id), adminToken);
	const availability = await getRecordById('nutrition_disponibilites', String(data.availabilityId), adminToken);
	const professional = await getRecordById('nutrition_professionnels', String(data.professionalId), adminToken);

	if (!availability?.id || !professional?.id) {
		throw new Error('Créneau ou professionnel introuvable.');
	}
	if (String(availability.professionnel_id) !== String(professional.id)) {
		throw new Error('Créneau invalide pour ce professionnel.');
	}
	if (new Date(String(availability.debut_at)).getTime() <= Date.now()) {
		throw new Error('Ce créneau n’est plus disponible.');
	}

	const existing = await listRecordsWithQuery<Record<string, any>>(
		'nutrition_rendezvous',
		`perPage=50&filter=${encodeURIComponent(`professionnel_id="${professional.id}" && statut="confirme"`)}`,
		adminToken,
	);

	if (
		existing.some((appointment) =>
			hasTimeOverlap(
				String(availability.debut_at),
				String(availability.fin_at),
				String(appointment.debut_at),
				String(appointment.fin_at),
			),
		)
	) {
		throw new Error('Ce créneau vient d’être réservé. Choisissez-en un autre.');
	}

	const created = (await createRecord(
		'nutrition_rendezvous',
		{
			professionnel_id: String(professional.id),
			user_id: String(user.id),
			disponibilite_id: String(availability.id),
			debut_at: String(availability.debut_at),
			fin_at: String(availability.fin_at),
			statut: 'confirme',
			motif: String(data.motif ?? '').trim(),
			user_nom_snapshot: String(`${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.name || user.email || 'Utilisateur'),
			user_email_snapshot: String(user.email ?? ''),
		},
		adminToken,
	)) as Record<string, any>;

	return {
		token: refreshedAuth.token,
		appointment: {
			id: String(created.id),
			professionalName: String(professional.nom_affiche ?? ''),
			dateLabel: formatAppointmentDateLabel(String(created.debut_at)),
			timeLabel: `${formatAppointmentTimeLabel(String(created.debut_at))} - ${formatAppointmentTimeLabel(String(created.fin_at))}`,
			status: 'confirmé',
		},
	};
}

export async function getUserAppointments(userToken: string) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await seedProfessionalsIfEmpty(adminToken);

	const userId = String(refreshedAuth.record.id);
	const appointments = await listRecordsWithQuery<Record<string, any>>(
		'nutrition_rendezvous',
		`perPage=300&filter=${encodeURIComponent(`user_id="${userId}"`)}&expand=professionnel_id`,
		adminToken,
	);

	const now = Date.now();
	const items = appointments
		.map((item) => {
			const professionalRecord = item.expand?.professionnel_id ?? null;
			const professionalCard = professionalRecord ? buildProfessionalCard(professionalRecord) : null;
			const startAt = String(item.debut_at ?? '');
			const endAt = String(item.fin_at ?? '');
			const status = String(item.statut ?? 'confirme');

			return {
				id: String(item.id),
				status,
				professionalName: professionalCard?.name ?? 'Professionnel',
				professionalSlug: professionalCard?.slug ?? '',
				professionalSpeciality: professionalCard?.specialityLabel ?? 'Professionnel nutrition',
				dateLabel: formatAppointmentDateLabel(startAt),
				timeLabel: `${formatAppointmentTimeLabel(startAt)} - ${formatAppointmentTimeLabel(endAt)}`,
				startAt,
				endAt,
				motif: String(item.motif ?? ''),
				isPast: new Date(endAt).getTime() < now,
			};
		})
		.sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime());

	return {
		token: refreshedAuth.token,
		upcoming: items.filter((item) => !item.isPast && item.status === 'confirme'),
		past: items.filter((item) => item.isPast || item.status !== 'confirme'),
	};
}

async function getProfessionalProfileByUserId(userId: string, token: string) {
	const items = await listRecordsWithQuery<Record<string, any>>(
		'nutrition_professionnels',
		`perPage=1&filter=${encodeURIComponent(`user_id="${userId}"`)}`,
		token,
	);
	return items[0] ?? null;
}

export async function getProfessionalDashboard(userToken: string) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await seedProfessionalsIfEmpty(adminToken);

	const user = await getUserRecordById(String(refreshedAuth.record.id), adminToken);
	const profile = await getProfessionalProfileByUserId(String(user.id), adminToken);

	if (!profile) {
		return {
			token: refreshedAuth.token,
			isProfessional: false,
			viewer: {
				firstName: String(user.prenom ?? user.name ?? user.email ?? 'Professionnel').split(' ')[0],
				fullName: String(`${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.name || user.email || 'Professionnel'),
			},
		};
	}

	const [availabilities, appointments] = await Promise.all([
		listRecordsWithQuery<Record<string, any>>(
			'nutrition_disponibilites',
			`perPage=300&filter=${encodeURIComponent(`professionnel_id="${profile.id}"`)}`,
			adminToken,
		),
		listRecordsWithQuery<Record<string, any>>(
			'nutrition_rendezvous',
			`perPage=300&filter=${encodeURIComponent(`professionnel_id="${profile.id}"`)}`,
			adminToken,
		),
	]);

	const upcomingAppointments = sortByCreatedAsc(
		appointments.filter(
			(item) => String(item.statut) === 'confirme' && new Date(String(item.debut_at)).getTime() >= Date.now(),
		),
	).map((item) => ({
		id: String(item.id),
		userName: String(item.user_nom_snapshot ?? 'Utilisateur'),
		userEmail: String(item.user_email_snapshot ?? ''),
		dateLabel: formatAppointmentDateLabel(String(item.debut_at)),
		timeLabel: `${formatAppointmentTimeLabel(String(item.debut_at))} - ${formatAppointmentTimeLabel(String(item.fin_at))}`,
		motif: String(item.motif ?? ''),
	}));

	const futureAvailabilities = sortByCreatedAsc(
		availabilities.filter((item) => new Date(String(item.debut_at)).getTime() >= Date.now()),
	).map((item) => ({
		id: String(item.id),
		dateLabel: formatAppointmentDateLabel(String(item.debut_at)),
		timeLabel: `${formatAppointmentTimeLabel(String(item.debut_at))} - ${formatAppointmentTimeLabel(String(item.fin_at))}`,
	}));

	return {
		token: refreshedAuth.token,
		isProfessional: true,
		viewer: {
			firstName: String(user.prenom ?? user.name ?? user.email ?? 'Professionnel').split(' ')[0],
			fullName: String(`${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.name || user.email || 'Professionnel'),
		},
		professional: buildProfessionalCard(profile),
		stats: {
			upcomingAppointments: upcomingAppointments.length,
			availableSlots: futureAvailabilities.length,
		},
		appointments: upcomingAppointments,
		availabilities: futureAvailabilities,
	};
}

export async function createProfessionalProfile(
	userToken: string,
	data: {
		nomAffiche: string;
		specialite: string;
		description: string;
		ville?: string;
		experienceAnnees?: number;
		tarifConsultation?: number;
		modesConsultation?: string[];
	},
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureProfessionalCollections(adminToken);

	const userId = String(refreshedAuth.record.id);
	const existing = await getProfessionalProfileByUserId(userId, adminToken);
	if (existing?.id) {
		throw new Error('Un espace professionnel existe déjà pour ce compte.');
	}

	const user = await getUserRecordById(userId, adminToken);
	const slugBase = slugifyKey(data.nomAffiche || `${user.prenom ?? ''}-${user.nom ?? ''}`) || `professionnel-${userId.slice(0, 6)}`;
	const allProfiles = await listRecordsWithQuery<Record<string, any>>('nutrition_professionnels', 'perPage=400', adminToken);
	let slug = slugBase;
	let suffix = 2;
	const slugs = new Set(allProfiles.map((item) => String(item.slug ?? '')).filter(Boolean));
	while (slugs.has(slug)) {
		slug = `${slugBase}-${suffix}`;
		suffix += 1;
	}

	await createRecord(
		'nutrition_professionnels',
		{
			user_id: userId,
			slug,
			nom_affiche: String(data.nomAffiche).trim(),
			specialite: String(data.specialite).trim(),
			description: String(data.description).trim(),
			experience_annees: Math.max(0, Number(data.experienceAnnees ?? 0)),
			ville: String(data.ville ?? '').trim(),
			tarif_consultation: Math.max(0, Number(data.tarifConsultation ?? 0)),
			modes_consultation: Array.isArray(data.modesConsultation) ? data.modesConsultation.join(',') : '',
			is_active: true,
		},
		adminToken,
	);

	await updateRecord('users', userId, { role: 'professionnel' }, adminToken);
	return getProfessionalDashboard(refreshedAuth.token);
}

export async function createProfessionalAvailability(
	userToken: string,
	data: {
		date: string;
		startTime: string;
		endTime: string;
	},
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureProfessionalCollections(adminToken);

	const profile = await getProfessionalProfileByUserId(String(refreshedAuth.record.id), adminToken);
	if (!profile?.id) {
		throw new Error('Profil professionnel introuvable.');
	}

	const startAt = toIsoDateTime(data.date, data.startTime);
	const endAt = toIsoDateTime(data.date, data.endTime);
	if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
		throw new Error('Le créneau de fin doit être après le début.');
	}

	const existing = await listRecordsWithQuery<Record<string, any>>(
		'nutrition_disponibilites',
		`perPage=300&filter=${encodeURIComponent(`professionnel_id="${profile.id}"`)}`,
		adminToken,
	);

	if (
		existing.some((slot) =>
			hasTimeOverlap(startAt, endAt, String(slot.debut_at), String(slot.fin_at)),
		)
	) {
		throw new Error('Ce créneau chevauche une disponibilité existante.');
	}

	await createRecord(
		'nutrition_disponibilites',
		{
			professionnel_id: String(profile.id),
			debut_at: startAt,
			fin_at: endAt,
			notes: '',
		},
		adminToken,
	);

	return getProfessionalDashboard(refreshedAuth.token);
}

export async function deleteProfessionalAvailability(
	userToken: string,
	availabilityId: string,
) {
	const refreshedAuth = await refreshUserAuth(userToken);
	const adminToken = await authenticatePocketBaseAdmin();
	await ensureProfessionalCollections(adminToken);

	const profile = await getProfessionalProfileByUserId(String(refreshedAuth.record.id), adminToken);
	if (!profile?.id) {
		throw new Error('Profil professionnel introuvable.');
	}

	const slot = await getRecordById('nutrition_disponibilites', availabilityId, adminToken);
	if (!slot?.id || String(slot.professionnel_id) !== String(profile.id)) {
		throw new Error('Créneau introuvable.');
	}

	const appointments = await listRecordsWithQuery<Record<string, any>>(
		'nutrition_rendezvous',
		`perPage=50&filter=${encodeURIComponent(`disponibilite_id="${availabilityId}" && statut="confirme"`)}`,
		adminToken,
	);
	if (appointments.length > 0) {
		throw new Error('Impossible de supprimer un créneau déjà réservé.');
	}

	await deleteRecord('nutrition_disponibilites', availabilityId, adminToken);
	return getProfessionalDashboard(refreshedAuth.token);
}
