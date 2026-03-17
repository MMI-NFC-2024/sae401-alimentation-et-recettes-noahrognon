type CalculateArgs = {
	age: number;
	sex: string;
	heightCm: number;
	weightKg: number;
	goalSlug: string;
	activityCoefficient: number;
};

export function calculateNutritionTargets(args: CalculateArgs) {
	const sexFactor = args.sex === 'homme' ? 5 : args.sex === 'femme' ? -161 : -78;
	const bmr = 10 * args.weightKg + 6.25 * args.heightCm - 5 * args.age + sexFactor;
	const maintenanceCalories = bmr * args.activityCoefficient;

	const goalAdjustments: Record<string, number> = {
		'perte-poids': -400,
		'prise-masse': 250,
		maintien: 0,
		equilibre: -100,
	};

	const calories = Math.max(1200, Math.round(maintenanceCalories + (goalAdjustments[args.goalSlug] ?? 0)));

	const proteinMultiplier =
		args.goalSlug === 'prise-masse' ? 2.2 :
		args.goalSlug === 'perte-poids' ? 2 :
		1.8;

	const proteins = Math.round(args.weightKg * proteinMultiplier);
	const fats = Math.round(args.weightKg * 0.9);
	const carbs = Math.max(60, Math.round((calories - proteins * 4 - fats * 9) / 4));
	const bmi = Number((args.weightKg / ((args.heightCm / 100) ** 2)).toFixed(1));

	return {
		calories,
		proteins,
		carbs,
		fats,
		bmi,
	};
}
