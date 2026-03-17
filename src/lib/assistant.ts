import {
	getFoodsCatalog,
	getMealPlannerDashboard,
	getRecipesCatalog,
	getTrackingDashboard,
	getUserDashboard,
} from './pocketbase';

type AssistantReplyPayload = {
	answer: string;
	relatedRecipes: Array<{
		id: string;
		slug: string;
		title: string;
		calories: number;
		duration: number;
		imageUrl: string | null;
		badge: string;
	}>;
	relatedLinks: Array<{
		label: string;
		href: string;
	}>;
};

function requireOpenAiKey() {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error("Clé OpenAI manquante. Ajoutez OPENAI_API_KEY dans le fichier .env.");
	}
	return apiKey;
}

function truncate(value: string, limit: number) {
	return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function buildSystemPrompt() {
	return [
		"Tu es Nutriv'IA, l'assistant nutritionnel de Nutrivia.",
		"Tu réponds toujours en français.",
		"Tu aides sur la nutrition, le sport loisir, l'organisation des repas, la planification hebdomadaire, les recettes du site, les listes de courses et le suivi alimentaire.",
		"Tu adaptes tes réponses au profil utilisateur fourni dans le contexte.",
		"Tu restes concret, structuré et utile. Donne des étapes actionnables quand c'est pertinent.",
		"Tu peux recommander les recettes du site si elles sont pertinentes.",
		"Tu ne fais pas de diagnostic médical. Si la question est médicale ou pathologique, conseille de consulter un professionnel de santé.",
		"Quand l'utilisateur demande un menu ou une planification, propose quelque chose de réaliste et simple à suivre.",
		"Évite d'inventer des fonctionnalités qui n'existent pas sur le site.",
	].join(' ');
}

function pickRelatedLinks(question: string) {
	const normalized = question.toLowerCase();
	const links = [];

	if (normalized.includes('menu') || normalized.includes('plan') || normalized.includes('semaine')) {
		links.push({ label: 'Ouvrir le planificateur', href: '/planificateur' });
	}
	if (normalized.includes('suivi') || normalized.includes('apport') || normalized.includes('macros')) {
		links.push({ label: 'Voir mon suivi', href: '/suivi' });
	}
	if (normalized.includes('course') || normalized.includes('liste')) {
		links.push({ label: 'Voir ma liste de courses', href: '/liste-courses' });
	}
	if (normalized.includes('recette') || normalized.includes('plat')) {
		links.push({ label: 'Parcourir les recettes', href: '/recettes' });
	}

	return links.slice(0, 3);
}

function getQuestionRecipeScore(
	question: string,
	recipe: {
		title: string;
		badge?: string;
		calories: number;
	},
) {
	const normalized = question.toLowerCase();
	const haystack = `${recipe.title} ${recipe.badge ?? ''}`.toLowerCase();
	let score = 0;

	for (const token of normalized.split(/[^a-zA-ZÀ-ÿ0-9]+/g).filter(Boolean)) {
		if (haystack.includes(token)) score += 2;
	}

	if (normalized.includes('rapide') && recipe.calories > 0) score += 0.5;
	if (normalized.includes('proté') || normalized.includes('prote')) {
		if (haystack.includes('proté') || haystack.includes('prote')) score += 3;
	}
	if (normalized.includes('léger') || normalized.includes('perte')) {
		if (recipe.calories <= 450) score += 2;
	}
	if (normalized.includes('prise de masse') || normalized.includes('masse')) {
		if (recipe.calories >= 450) score += 2;
	}

	return score;
}

function pickRelatedRecipes(
	question: string,
	recipes: Array<{
		id: string;
		slug: string;
		titre: string;
		caloriesParPortion: number;
		tempsPreparationMin: number;
		photoUrl: string | null;
		badge?: string;
	}>,
) {
	return [...recipes]
		.sort((left, right) => getQuestionRecipeScore(question, { title: right.titre, badge: right.badge, calories: right.caloriesParPortion }) - getQuestionRecipeScore(question, { title: left.titre, badge: left.badge, calories: left.caloriesParPortion }))
		.slice(0, 3)
		.map((recipe) => ({
			id: recipe.id,
			slug: recipe.slug,
			title: recipe.titre,
			calories: recipe.caloriesParPortion,
			duration: recipe.tempsPreparationMin,
			imageUrl: recipe.photoUrl,
			badge: recipe.badge ?? 'Recommandée',
		}));
}

function buildContextSummary(data: {
	dashboard: Awaited<ReturnType<typeof getUserDashboard>>;
	planner: Awaited<ReturnType<typeof getMealPlannerDashboard>>;
	recipes: Awaited<ReturnType<typeof getRecipesCatalog>>;
	foods: Awaited<ReturnType<typeof getFoodsCatalog>>;
	tracking: Awaited<ReturnType<typeof getTrackingDashboard>>;
}) {
	const { dashboard, planner, recipes, foods, tracking } = data;

	return {
		utilisateur: {
			prenom: dashboard.user.firstName,
			objectif: dashboard.user.goalLabel,
			regime: dashboard.user.dietLabel,
			activite: dashboard.user.activityLabel,
			seancesParSemaine: dashboard.user.sessions,
			poidsActuelKg: dashboard.user.currentWeight,
			poidsObjectifKg: dashboard.user.targetWeight,
		},
		objectifsJournaliers: dashboard.goals,
		suiviDuJour: {
			caloriesConsommees: dashboard.today.caloriesConsumed,
			caloriesCible: dashboard.today.caloriesTarget,
			proteinesConsommees: dashboard.today.proteinsConsumed,
			glucidesConsommes: dashboard.today.carbsConsumed,
			lipidesConsommes: dashboard.today.fatsConsumed,
		},
		planningDuJour: dashboard.planningToday.map((item) => ({
			repas: item.mealLabel,
			recette: item.title,
			calories: item.calories,
		})),
		planningSemaine: planner.week.days.map((day) => ({
			jour: day.label,
			calories: day.totalCalories,
			repas: day.meals.filter((meal) => meal.entry).map((meal) => ({
				type: meal.mealLabel,
				recette: meal.entry?.title,
			})),
		})),
		recettesSite: recipes.recipes.slice(0, 14).map((recipe) => ({
			titre: recipe.titre,
			slug: recipe.slug,
			calories: recipe.caloriesParPortion,
			temps: recipe.tempsPreparationMin,
			objectif: recipe.objectif?.libelle ?? null,
			regimes: recipe.regimes.map((item) => item.libelle),
			tags: recipe.tags.map((item) => item.libelle),
		})),
		alimentsUtiles: foods.foods.slice(0, 12).map((food) => ({
			nom: food.nom,
			categorie: food.categorie,
			calories100g: food.calories100g,
			proteines100g: food.proteines100g,
			glucides100g: food.glucides100g,
			lipides100g: food.lipides100g,
		})),
		syntheseSemaine: {
			caloriesMoyennes: tracking.weeklySummary.averageCalories,
			proteinesMoyennes: tracking.weeklySummary.averageProteins,
			joursRespectes: tracking.weeklySummary.complianceDays,
			regularite: tracking.weeklySummary.regularityLabel,
		},
	};
}

async function callOpenAi(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) {
	const apiKey = requireOpenAiKey();
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
			temperature: 0.7,
			messages,
		}),
	});

	const payload = await response.json();
	if (!response.ok) {
		throw new Error(payload?.error?.message ?? payload?.message ?? "Impossible d'obtenir une réponse de l'assistant.");
	}

	const content = payload?.choices?.[0]?.message?.content;
	if (typeof content === 'string' && content.trim()) {
		return content.trim();
	}

	if (Array.isArray(content)) {
		const joined = content.map((item) => item?.text ?? '').join('\n').trim();
		if (joined) return joined;
	}

	throw new Error("Réponse OpenAI vide.");
}

export async function generateAssistantReply(
	userToken: string,
	conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
	userMessage: string,
): Promise<AssistantReplyPayload> {
	const [dashboard, planner, recipes, foods, tracking] = await Promise.all([
		getUserDashboard(userToken),
		getMealPlannerDashboard(userToken),
		getRecipesCatalog(userToken),
		getFoodsCatalog(userToken),
		getTrackingDashboard(userToken),
	]);

	const context = buildContextSummary({ dashboard, planner, recipes, foods, tracking });
	const history = conversationMessages.slice(-8).map((message) => ({
		role: message.role,
		content: message.content,
	}));

	const answer = await callOpenAi([
		{ role: 'system', content: buildSystemPrompt() },
		{
			role: 'system',
			content: `Contexte utilisateur et site Nutrivia:\n${truncate(JSON.stringify(context), 12000)}`,
		},
		...history,
		{ role: 'user', content: userMessage },
	]);

	const recipesForSelection = recipes.recipes.map((recipe) => ({
		id: recipe.id,
		slug: recipe.slug,
		titre: recipe.titre,
		caloriesParPortion: Number(recipe.caloriesParPortion ?? 0),
		tempsPreparationMin: Number(recipe.tempsPreparationMin ?? 0),
		photoUrl: recipe.photoUrl,
		badge: recipe.tags?.[0]?.libelle ?? recipe.objectif?.libelle ?? 'Recommandée',
	}));

	return {
		answer,
		relatedRecipes: pickRelatedRecipes(userMessage, recipesForSelection),
		relatedLinks: pickRelatedLinks(userMessage),
	};
}
