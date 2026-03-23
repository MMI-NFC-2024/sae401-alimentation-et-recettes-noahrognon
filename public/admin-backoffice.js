(function () {
	const storageKey = 'nutrivia_admin_auth';
	const authNeeded = document.querySelector('#admin-auth-needed');
	const loading = document.querySelector('#admin-loading');
	const shell = document.querySelector('#admin-shell');
	const errorBox = document.querySelector('#admin-error');
	const tabsContainer = document.querySelector('#admin-tabs');
	if (!loading || !tabsContainer) return;

	let payload = null;
	let activeTab = 'dashboard';
	const state = {
		userSearch: '',
		recipeSearch: '',
		recipeStatus: '',
		foodSearch: '',
		foodStatus: '',
		communitySearch: '',
		professionalSearch: '',
	};

	const tabs = [
		{ id: 'dashboard', label: 'Vue globale' },
		{ id: 'validations', label: 'Validations' },
		{ id: 'users', label: 'Utilisateurs' },
		{ id: 'recipes', label: 'Recettes' },
		{ id: 'foods', label: 'Aliments' },
		{ id: 'community', label: 'Communauté' },
		{ id: 'professionals', label: 'Professionnels' },
	];

	function getStoredAdminAuth() {
		try {
			return JSON.parse(localStorage.getItem(storageKey) || 'null');
		} catch {
			return null;
		}
	}

	function setStoredAdminAuth(value) {
		if (!value?.token) return;
		localStorage.setItem(storageKey, JSON.stringify(value));
	}

	function clearStoredAdminAuth() {
		localStorage.removeItem(storageKey);
	}

	function esc(value) {
		return String(value ?? '')
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#039;');
	}

	function showError(message = '') {
		errorBox.textContent = message;
		errorBox.classList.toggle('hidden', !message);
	}

	function getHeaders() {
		const auth = getStoredAdminAuth();
		return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
	}

	function getStatusBadgeClasses(value) {
		if (value === 'approved' || value === 'visible') return 'bg-[#d8f7e1] text-[#0a9a68]';
		if (value === 'pending') return 'bg-[#fff3dc] text-[#c67a09]';
		if (value === 'rejected' || value === 'hidden') return 'bg-[#fff1f1] text-[#c24141]';
		return 'bg-slate-100 text-slate-600';
	}

	function formatStatusLabel(value) {
		const source = String(value ?? '').trim();
		return source ? source.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase()) : 'Inconnu';
	}

	function bindAdminAction(selector, handler) {
		Array.from(document.querySelectorAll(selector)).forEach((button) => button.addEventListener('click', handler));
	}

	function renderTabs() {
		tabsContainer.innerHTML = tabs
			.map(
				(tab) => `
					<button type="button" data-tab="${tab.id}" class="rounded-full border px-4 py-2 text-sm font-semibold transition ${
						tab.id === activeTab ? 'border-[#08b37d] bg-[#d8f7e1] text-[#0a9a68]' : 'border-[#cad8e7] bg-white text-slate-600'
					}">
						${esc(tab.label)}
					</button>
				`,
			)
			.join('');

		Array.from(tabsContainer.querySelectorAll('[data-tab]')).forEach((button) => {
			button.addEventListener('click', () => {
				activeTab = button.getAttribute('data-tab') || 'dashboard';
				updateTabVisibility();
			});
		});
	}

	function updateTabVisibility() {
		renderTabs();
		Array.from(document.querySelectorAll('.admin-tab-content')).forEach((node) => node.classList.add('hidden'));
		document.querySelector(`#admin-tab-${activeTab}`)?.classList.remove('hidden');
	}

	function readFileAsDataUrl(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result || ''));
			reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
			reader.readAsDataURL(file);
		});
	}

	function renderDashboard() {
		document.querySelector('#stat-users').textContent = String(payload.stats?.users || 0);
		document.querySelector('#stat-recipes').textContent = String(payload.stats?.recipes || 0);
		document.querySelector('#stat-foods').textContent = String(payload.stats?.foods || 0);
		document.querySelector('#stat-pros').textContent = String(payload.stats?.professionals || 0);
		document.querySelector('#stat-appointments').textContent = String(payload.stats?.appointments || 0);
		document.querySelector('#stat-pending-recipes').textContent = String(payload.stats?.pendingRecipes || 0);
		document.querySelector('#stat-pending-foods').textContent = String(payload.stats?.pendingFoods || 0);
		document.querySelector('#stat-hidden-content').textContent = String((payload.stats?.hiddenPosts || 0) + (payload.stats?.hiddenComments || 0));
		document.querySelector('#dash-published-recipes').textContent = String(payload.stats?.publishedRecipes || 0);
		document.querySelector('#dash-active-pros').textContent = String(payload.stats?.activeProfessionals || 0);
		document.querySelector('#dash-posts').textContent = String(payload.stats?.posts || 0);
		document.querySelector('#dash-comments').textContent = String(payload.stats?.comments || 0);
		document.querySelector('#viewer-email').textContent = payload.viewer?.email || '';

		document.querySelector('#admin-recent-users').innerHTML = (payload.highlights?.recentUsers || [])
			.map((user) => `<div class="flex items-center justify-between gap-4 rounded-[20px] border border-[#d8e5f1] px-4 py-4"><div><p class="font-semibold text-slate-900">${esc(user.fullName)}</p><p class="mt-1 text-sm text-slate-500">${esc(user.email)}</p></div><span class="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">${esc(formatStatusLabel(user.role))}</span></div>`)
			.join('');

		document.querySelector('#admin-top-posts').innerHTML = (payload.highlights?.topPosts || [])
			.map((post) => `<div class="rounded-[20px] border border-[#d8e5f1] p-4"><p class="font-semibold text-slate-900">${esc(post.author)}</p><p class="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">${esc(post.description)}</p><p class="mt-3 text-xs font-semibold text-slate-400">${esc(post.likes)} likes · ${esc(post.comments)} commentaires</p></div>`)
			.join('');

		document.querySelector('#admin-upcoming-appointments').innerHTML = (payload.highlights?.upcomingAppointments || [])
			.map((appointment) => `<div class="rounded-[20px] border border-[#d8e5f1] p-4"><p class="font-semibold text-slate-900">${esc(appointment.professionalName)}</p><p class="mt-1 text-sm text-slate-500">${esc(appointment.userName)}</p><p class="mt-2 text-sm text-slate-600">${esc(appointment.dateLabel)} · ${esc(appointment.timeLabel)}</p></div>`)
			.join('');

		const priorityActions = [
			{ label: 'Recettes à valider', count: payload.stats?.pendingRecipes || 0, tab: 'validations' },
			{ label: 'Aliments à valider', count: payload.stats?.pendingFoods || 0, tab: 'validations' },
			{ label: 'Professionnels à valider', count: payload.stats?.pendingProfessionals || 0, tab: 'validations' },
			{ label: 'Contenus masqués', count: (payload.stats?.hiddenPosts || 0) + (payload.stats?.hiddenComments || 0), tab: 'community' },
		];

		document.querySelector('#admin-priority-actions').innerHTML = priorityActions
			.map((action) => `<button type="button" data-jump-tab="${action.tab}" class="flex w-full items-center justify-between rounded-[18px] border border-[#d8e5f1] px-4 py-3 text-left transition hover:border-[#08b37d] hover:bg-[#f7fffb]"><span class="font-semibold text-slate-800">${esc(action.label)}</span><span class="rounded-full ${action.count > 0 ? 'bg-[#fff3dc] text-[#c67a09]' : 'bg-slate-100 text-slate-500'} px-3 py-1 text-xs font-semibold">${esc(action.count)}</span></button>`)
			.join('');

		Array.from(document.querySelectorAll('[data-jump-tab]')).forEach((button) => {
			button.addEventListener('click', () => {
				activeTab = button.getAttribute('data-jump-tab') || 'dashboard';
				updateTabVisibility();
			});
		});
	}

	function renderValidations() {
		document.querySelector('#admin-pending-recipes').innerHTML = (payload.recipes || [])
			.filter((recipe) => recipe.validationStatus === 'pending')
			.map((recipe) => `<div class="rounded-[20px] border border-[#d8e5f1] p-4"><p class="font-semibold text-slate-900">${esc(recipe.title)}</p><p class="mt-1 text-sm text-slate-500">${esc(recipe.goal || 'Sans objectif')}</p><div class="mt-4 flex gap-2"><button data-recipe-validation="${esc(recipe.id)}" data-status="approved" class="rounded-[14px] bg-[#08b37d] px-3 py-2 text-sm font-semibold text-white">Approuver</button><button data-recipe-validation="${esc(recipe.id)}" data-status="rejected" class="rounded-[14px] border border-[#ffd8d8] px-3 py-2 text-sm font-semibold text-[#c24141]">Refuser</button></div></div>`)
			.join('') || '<p class="text-sm text-slate-500">Aucune recette en attente.</p>';

		document.querySelector('#admin-pending-foods').innerHTML = (payload.foods || [])
			.filter((food) => food.validationStatus === 'pending')
			.map((food) => `<div class="rounded-[20px] border border-[#d8e5f1] p-4"><p class="font-semibold text-slate-900">${esc(food.name)}</p><p class="mt-1 text-sm text-slate-500">${esc(food.category)} · ${esc(food.calories)} kcal</p><div class="mt-4 flex gap-2"><button data-food-validation="${esc(food.id)}" data-status="approved" class="rounded-[14px] bg-[#08b37d] px-3 py-2 text-sm font-semibold text-white">Approuver</button><button data-food-validation="${esc(food.id)}" data-status="rejected" class="rounded-[14px] border border-[#ffd8d8] px-3 py-2 text-sm font-semibold text-[#c24141]">Refuser</button></div></div>`)
			.join('') || '<p class="text-sm text-slate-500">Aucun aliment en attente.</p>';

		document.querySelector('#admin-pending-professionals').innerHTML = (payload.professionals || [])
			.filter((professional) => professional.approvalStatus === 'pending')
			.map((professional) => `<div class="rounded-[20px] border border-[#d8e5f1] p-4"><p class="font-semibold text-slate-900">${esc(professional.name)}</p><p class="mt-1 text-sm text-slate-500">${esc(professional.speciality)}${professional.city ? ` · ${esc(professional.city)}` : ''}</p><div class="mt-4 flex gap-2"><button data-professional-approval="${esc(professional.id)}" data-status="approved" class="rounded-[14px] bg-[#08b37d] px-3 py-2 text-sm font-semibold text-white">Approuver</button><button data-professional-approval="${esc(professional.id)}" data-status="rejected" class="rounded-[14px] border border-[#ffd8d8] px-3 py-2 text-sm font-semibold text-[#c24141]">Refuser</button></div></div>`)
			.join('') || '<p class="text-sm text-slate-500">Aucun professionnel en attente.</p>';

		bindAdminAction('[data-recipe-validation]', async (event) => await adminPatch({ action: 'recipe_validation', recipeId: event.currentTarget.getAttribute('data-recipe-validation'), validationStatus: event.currentTarget.getAttribute('data-status') }));
		bindAdminAction('[data-food-validation]', async (event) => await adminPatch({ action: 'food_validation', foodId: event.currentTarget.getAttribute('data-food-validation'), validationStatus: event.currentTarget.getAttribute('data-status') }));
		bindAdminAction('[data-professional-approval]', async (event) => await adminPatch({ action: 'professional_approval', professionalId: event.currentTarget.getAttribute('data-professional-approval'), approvalStatus: event.currentTarget.getAttribute('data-status') }));
	}

	function renderUsers() {
		const search = state.userSearch.trim().toLowerCase();
		const users = (payload.users || []).filter((user) => !search || `${user.fullName} ${user.email} ${user.role}`.toLowerCase().includes(search));
		document.querySelector('#admin-users-list').innerHTML = users.map((user) => `<div class="flex flex-col gap-4 rounded-[20px] border border-[#d8e5f1] p-4 md:flex-row md:items-center md:justify-between"><div><p class="font-semibold text-slate-900">${esc(user.fullName)}</p><p class="mt-1 text-sm text-slate-500">${esc(user.email)}</p></div><div class="flex items-center gap-3"><select data-user-role="${esc(user.id)}" class="h-11 rounded-[14px] border border-[#cad8e7] px-3 text-sm text-slate-700 outline-none"><option value="user" ${user.role === 'user' ? 'selected' : ''}>Utilisateur</option><option value="professionnel" ${user.role === 'professionnel' ? 'selected' : ''}>Professionnel</option></select><button data-save-user-role="${esc(user.id)}" class="rounded-[14px] bg-[#16223c] px-4 py-2.5 text-sm font-semibold text-white">Enregistrer</button></div></div>`).join('') || '<p class="text-sm text-slate-500">Aucun utilisateur trouvé.</p>';

		bindAdminAction('[data-save-user-role]', async (event) => {
			const userId = event.currentTarget.getAttribute('data-save-user-role');
			const select = document.querySelector(`[data-user-role="${userId}"]`);
			await adminPatch({ action: 'user_role', userId, role: select?.value || 'user' });
		});
	}

	function renderGoalOptions() {
		const goalSelect = document.querySelector('#admin-recipe-goal');
		if (!goalSelect) return;
		goalSelect.innerHTML = ['<option value="">Sans objectif lié</option>'].concat((payload.options?.goals || []).map((goal) => `<option value="${esc(goal.id)}">${esc(goal.label)}</option>`)).join('');
	}

	function renderFoodCategoryOptions() {
		const categorySelect = document.querySelector('#admin-food-category');
		if (!categorySelect) return;
		categorySelect.innerHTML = (payload.options?.foodCategories || []).map((category) => `<option value="${esc(category.value)}">${esc(formatStatusLabel(category.label))}</option>`).join('');
	}

	function renderRecipes() {
		const search = state.recipeSearch.trim().toLowerCase();
		const status = state.recipeStatus;
		const recipes = (payload.recipes || []).filter((recipe) => (!search || `${recipe.title} ${recipe.goal} ${recipe.slug}`.toLowerCase().includes(search)) && (!status || recipe.validationStatus === status));
		document.querySelector('#admin-recipes-list').innerHTML = recipes.map((recipe) => `<div class="rounded-[22px] border border-[#d8e5f1] bg-white p-4"><div class="h-[150px] overflow-hidden rounded-[18px] bg-slate-100">${recipe.imageUrl ? `<img src="${esc(recipe.imageUrl)}" alt="${esc(recipe.title)}" class="h-full w-full object-cover" />` : ''}</div><div class="mt-4 flex items-start justify-between gap-3"><div><p class="font-semibold text-slate-900">${esc(recipe.title)}</p><p class="mt-1 text-sm text-slate-500">${esc(recipe.goal || 'Sans objectif lié')}</p></div><span class="rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(recipe.validationStatus)}">${esc(formatStatusLabel(recipe.validationStatus))}</span></div><p class="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">${esc(recipe.sourceType || 'site')}</p><div class="mt-4 flex flex-wrap gap-2"><button data-toggle-recipe="${esc(recipe.id)}" data-published="${recipe.published ? '1' : '0'}" class="rounded-[14px] border border-[#cad8e7] px-3 py-2 text-sm font-semibold text-slate-700">${recipe.published ? 'Masquer' : 'Publier'}</button><button data-recipe-validation="${esc(recipe.id)}" data-status="approved" class="rounded-[14px] bg-[#08b37d] px-3 py-2 text-sm font-semibold text-white">Approuver</button><button data-recipe-validation="${esc(recipe.id)}" data-status="rejected" class="rounded-[14px] border border-[#ffd8d8] px-3 py-2 text-sm font-semibold text-[#c24141]">Refuser</button></div></div>`).join('') || '<p class="text-sm text-slate-500">Aucune recette trouvée.</p>';
		bindAdminAction('[data-toggle-recipe]', async (event) => await adminPatch({ action: 'recipe_publish', recipeId: event.currentTarget.getAttribute('data-toggle-recipe'), published: event.currentTarget.getAttribute('data-published') !== '1' }));
		bindAdminAction('[data-recipe-validation]', async (event) => await adminPatch({ action: 'recipe_validation', recipeId: event.currentTarget.getAttribute('data-recipe-validation'), validationStatus: event.currentTarget.getAttribute('data-status') }));
	}

	function renderFoods() {
		const search = state.foodSearch.trim().toLowerCase();
		const status = state.foodStatus;
		const foods = (payload.foods || []).filter((food) => (!search || `${food.name} ${food.category}`.toLowerCase().includes(search)) && (!status || food.validationStatus === status));
		document.querySelector('#admin-foods-list').innerHTML = foods.map((food) => `<div class="rounded-[22px] border border-[#d8e5f1] bg-white p-4"><div class="flex gap-3"><div class="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[16px] bg-slate-100">${food.imageUrl ? `<img src="${esc(food.imageUrl)}" alt="${esc(food.name)}" class="h-full w-full object-cover" />` : ''}</div><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><p class="font-semibold text-slate-900">${esc(food.name)}</p><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClasses(food.validationStatus)}">${esc(formatStatusLabel(food.validationStatus))}</span></div><p class="mt-1 text-sm text-slate-500">${esc(food.category)} · ${esc(food.calories)} kcal / 100g</p></div></div><div class="mt-4 flex flex-wrap gap-2"><button data-food-validation="${esc(food.id)}" data-status="approved" class="rounded-[14px] bg-[#08b37d] px-3 py-2 text-sm font-semibold text-white">Approuver</button><button data-food-validation="${esc(food.id)}" data-status="rejected" class="rounded-[14px] border border-[#ffd8d8] px-3 py-2 text-sm font-semibold text-[#c24141]">Refuser</button><button data-delete-food="${esc(food.id)}" class="rounded-[14px] border border-[#ffd8d8] px-3 py-2 text-sm font-semibold text-[#c24141]">Supprimer</button></div></div>`).join('') || '<p class="text-sm text-slate-500">Aucun aliment trouvé.</p>';
		bindAdminAction('[data-food-validation]', async (event) => await adminPatch({ action: 'food_validation', foodId: event.currentTarget.getAttribute('data-food-validation'), validationStatus: event.currentTarget.getAttribute('data-status') }));
		bindAdminAction('[data-delete-food]', async (event) => await adminDelete({ action: 'food', foodId: event.currentTarget.getAttribute('data-delete-food') }));
	}

	function renderCommunity() {
		const search = state.communitySearch.trim().toLowerCase();
		const posts = (payload.posts || []).filter((post) => !search || `${post.author} ${post.description} ${(post.hashtags || []).join(' ')}`.toLowerCase().includes(search));
		const comments = (payload.comments || []).filter((comment) => !search || `${comment.author} ${comment.content}`.toLowerCase().includes(search));
		document.querySelector('#admin-posts-list').innerHTML = posts.map((post) => `<div class="rounded-[20px] border border-[#d8e5f1] p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold text-slate-900">${esc(post.author)}</p><p class="mt-2 text-sm leading-6 text-slate-600">${esc(post.description)}</p></div><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClasses(post.moderationStatus)}">${esc(formatStatusLabel(post.moderationStatus))}</span></div><p class="mt-2 text-xs text-slate-400">${esc((post.hashtags || []).join(' '))}</p><p class="mt-2 text-xs font-semibold text-slate-400">${esc(post.likes)} likes · ${esc(post.comments)} commentaires</p><div class="mt-4 flex flex-wrap gap-2"><button data-post-moderation="${esc(post.id)}" data-status="${post.moderationStatus === 'hidden' ? 'visible' : 'hidden'}" class="rounded-[14px] border border-[#cad8e7] px-3 py-2 text-sm font-semibold text-slate-700">${post.moderationStatus === 'hidden' ? 'Rendre visible' : 'Masquer'}</button><button data-delete-post="${esc(post.id)}" class="rounded-[14px] border border-[#ffd8d8] px-3 py-2 text-sm font-semibold text-[#c24141]">Supprimer</button></div></div>`).join('') || '<p class="text-sm text-slate-500">Aucune publication trouvée.</p>';
		document.querySelector('#admin-comments-list').innerHTML = comments.map((comment) => `<div class="rounded-[20px] border border-[#d8e5f1] p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold text-slate-900">${esc(comment.author)}</p><p class="mt-2 text-sm leading-6 text-slate-600">${esc(comment.content)}</p></div><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClasses(comment.moderationStatus)}">${esc(formatStatusLabel(comment.moderationStatus))}</span></div><div class="mt-4 flex flex-wrap gap-2"><button data-comment-moderation="${esc(comment.id)}" data-status="${comment.moderationStatus === 'hidden' ? 'visible' : 'hidden'}" class="rounded-[14px] border border-[#cad8e7] px-3 py-2 text-sm font-semibold text-slate-700">${comment.moderationStatus === 'hidden' ? 'Rendre visible' : 'Masquer'}</button><button data-delete-comment="${esc(comment.id)}" class="rounded-[14px] border border-[#ffd8d8] px-3 py-2 text-sm font-semibold text-[#c24141]">Supprimer</button></div></div>`).join('') || '<p class="text-sm text-slate-500">Aucun commentaire trouvé.</p>';
		bindAdminAction('[data-post-moderation]', async (event) => await adminPatch({ action: 'post_moderation', postId: event.currentTarget.getAttribute('data-post-moderation'), moderationStatus: event.currentTarget.getAttribute('data-status') }));
		bindAdminAction('[data-comment-moderation]', async (event) => await adminPatch({ action: 'comment_moderation', commentId: event.currentTarget.getAttribute('data-comment-moderation'), moderationStatus: event.currentTarget.getAttribute('data-status') }));
		bindAdminAction('[data-delete-post]', async (event) => await adminDelete({ action: 'post', postId: event.currentTarget.getAttribute('data-delete-post') }));
		bindAdminAction('[data-delete-comment]', async (event) => await adminDelete({ action: 'comment', commentId: event.currentTarget.getAttribute('data-delete-comment') }));
	}

	function renderProfessionals() {
		const search = state.professionalSearch.trim().toLowerCase();
		const professionals = (payload.professionals || []).filter((professional) => !search || `${professional.name} ${professional.speciality} ${professional.city}`.toLowerCase().includes(search));
		document.querySelector('#admin-professionals-list').innerHTML = professionals.map((professional) => `<div class="rounded-[20px] border border-[#d8e5f1] p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold text-slate-900">${esc(professional.name)}</p><p class="mt-1 text-sm text-slate-500">${esc(professional.speciality)}${professional.city ? ` · ${esc(professional.city)}` : ''}</p></div><div class="flex flex-col items-end gap-2"><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClasses(professional.approvalStatus)}">${esc(formatStatusLabel(professional.approvalStatus))}</span><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold ${professional.isActive ? 'bg-[#d8f7e1] text-[#0a9a68]' : 'bg-slate-100 text-slate-500'}">${professional.isActive ? 'Actif' : 'Désactivé'}</span></div></div><div class="mt-4 flex flex-wrap gap-2"><button data-professional-approval="${esc(professional.id)}" data-status="approved" class="rounded-[14px] bg-[#08b37d] px-3 py-2 text-sm font-semibold text-white">Approuver</button><button data-professional-approval="${esc(professional.id)}" data-status="rejected" class="rounded-[14px] border border-[#ffd8d8] px-3 py-2 text-sm font-semibold text-[#c24141]">Refuser</button><button data-toggle-professional="${esc(professional.id)}" data-active="${professional.isActive ? '1' : '0'}" class="rounded-[14px] border border-[#cad8e7] px-3 py-2 text-sm font-semibold text-slate-700">${professional.isActive ? 'Désactiver' : 'Activer'}</button></div></div>`).join('') || '<p class="text-sm text-slate-500">Aucun professionnel trouvé.</p>';
		document.querySelector('#admin-appointments-list').innerHTML = (payload.appointments || []).map((appointment) => `<div class="rounded-[20px] border border-[#d8e5f1] p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold text-slate-900">${esc(appointment.professionalName)}</p><p class="mt-1 text-sm text-slate-500">${esc(appointment.userName)}</p><p class="mt-2 text-sm text-slate-600">${esc(appointment.dateLabel)} · ${esc(appointment.timeLabel)}</p></div><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold ${appointment.status === 'confirme' ? 'bg-[#d8f7e1] text-[#0a9a68]' : 'bg-slate-100 text-slate-500'}">${esc(formatStatusLabel(appointment.status))}</span></div></div>`).join('') || '<p class="text-sm text-slate-500">Aucun rendez-vous trouvé.</p>';
		bindAdminAction('[data-professional-approval]', async (event) => await adminPatch({ action: 'professional_approval', professionalId: event.currentTarget.getAttribute('data-professional-approval'), approvalStatus: event.currentTarget.getAttribute('data-status') }));
		bindAdminAction('[data-toggle-professional]', async (event) => await adminPatch({ action: 'professional_active', professionalId: event.currentTarget.getAttribute('data-toggle-professional'), isActive: event.currentTarget.getAttribute('data-active') !== '1' }));
	}

	function renderAll() {
		renderTabs();
		renderGoalOptions();
		renderFoodCategoryOptions();
		renderDashboard();
		renderValidations();
		renderUsers();
		renderRecipes();
		renderFoods();
		renderCommunity();
		renderProfessionals();
		updateTabVisibility();
	}

	async function adminPost(body) {
		try {
			const response = await fetch('/app-api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', ...getHeaders() }, body: JSON.stringify(body) });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Création impossible.');
			payload = result;
			setStoredAdminAuth({ ...(getStoredAdminAuth() || {}), token: result.token, record: { email: result.viewer?.email || '' } });
			showError('');
			renderAll();
		} catch (error) {
			showError(error instanceof Error ? error.message : 'Création impossible.');
		}
	}

	async function adminPatch(body) {
		try {
			const response = await fetch('/app-api/admin', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getHeaders() }, body: JSON.stringify(body) });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Action admin impossible.');
			payload = result;
			setStoredAdminAuth({ ...(getStoredAdminAuth() || {}), token: result.token, record: { email: result.viewer?.email || '' } });
			showError('');
			renderAll();
		} catch (error) {
			showError(error instanceof Error ? error.message : 'Action admin impossible.');
		}
	}

	async function adminDelete(body) {
		try {
			const response = await fetch('/app-api/admin', { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...getHeaders() }, body: JSON.stringify(body) });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Suppression impossible.');
			payload = result;
			setStoredAdminAuth({ ...(getStoredAdminAuth() || {}), token: result.token, record: { email: result.viewer?.email || '' } });
			showError('');
			renderAll();
		} catch (error) {
			showError(error instanceof Error ? error.message : 'Suppression impossible.');
		}
	}

	function bindFilters() {
		document.querySelector('#admin-users-search')?.addEventListener('input', (event) => { state.userSearch = event.currentTarget.value; renderUsers(); });
		document.querySelector('#admin-recipes-search')?.addEventListener('input', (event) => { state.recipeSearch = event.currentTarget.value; renderRecipes(); });
		document.querySelector('#admin-recipes-status')?.addEventListener('change', (event) => { state.recipeStatus = event.currentTarget.value; renderRecipes(); });
		document.querySelector('#admin-foods-search')?.addEventListener('input', (event) => { state.foodSearch = event.currentTarget.value; renderFoods(); });
		document.querySelector('#admin-foods-status')?.addEventListener('change', (event) => { state.foodStatus = event.currentTarget.value; renderFoods(); });
		document.querySelector('#admin-community-search')?.addEventListener('input', (event) => { state.communitySearch = event.currentTarget.value; renderCommunity(); });
		document.querySelector('#admin-professionals-search')?.addEventListener('input', (event) => { state.professionalSearch = event.currentTarget.value; renderProfessionals(); });
	}

	function bindCreateForms() {
		document.querySelector('#admin-add-recipe-form')?.addEventListener('submit', async (event) => {
			event.preventDefault();
			const form = event.currentTarget;
			if (!(form instanceof HTMLFormElement)) return;
			const imageFile = document.querySelector('#admin-recipe-image')?.files?.[0] ?? null;
			const formData = new FormData(form);
			await adminPost({ action: 'add_recipe', title: String(formData.get('title') ?? ''), description: String(formData.get('description') ?? ''), goalId: String(formData.get('goalId') ?? ''), timeMinutes: Number(formData.get('timeMinutes') ?? 20), portions: Number(formData.get('portions') ?? 2), calories: Number(formData.get('calories') ?? 0), proteins: Number(formData.get('proteins') ?? 0), carbs: Number(formData.get('carbs') ?? 0), fats: Number(formData.get('fats') ?? 0), fibers: Number(formData.get('fibers') ?? 0), difficulty: String(formData.get('difficulty') ?? 'facile'), ingredientsText: String(formData.get('ingredientsText') ?? ''), stepsText: String(formData.get('stepsText') ?? ''), published: formData.get('published') === 'on', validationStatus: String(formData.get('validationStatus') ?? 'approved'), imageDataUrl: imageFile ? await readFileAsDataUrl(imageFile) : '' });
			form.reset();
			document.querySelector('#admin-recipe-goal').value = '';
		});

		document.querySelector('#admin-add-food-form')?.addEventListener('submit', async (event) => {
			event.preventDefault();
			const form = event.currentTarget;
			if (!(form instanceof HTMLFormElement)) return;
			const imageFile = document.querySelector('#admin-food-image')?.files?.[0] ?? null;
			const formData = new FormData(form);
			await adminPost({ action: 'add_food', name: String(formData.get('name') ?? ''), category: String(formData.get('category') ?? 'autre'), description: String(formData.get('description') ?? ''), calories: Number(formData.get('calories') ?? 0), proteins: Number(formData.get('proteins') ?? 0), carbs: Number(formData.get('carbs') ?? 0), fats: Number(formData.get('fats') ?? 0), fibers: Number(formData.get('fibers') ?? 0), unit: String(formData.get('unit') ?? 'g'), validationStatus: String(formData.get('validationStatus') ?? 'approved'), imageDataUrl: imageFile ? await readFileAsDataUrl(imageFile) : '' });
			form.reset();
		});
	}

	async function loadAdmin() {
		const auth = getStoredAdminAuth();
		if (!auth?.token) {
			loading.classList.add('hidden');
			authNeeded.classList.remove('hidden');
			return;
		}

		try {
			const response = await fetch('/app-api/admin', { headers: getHeaders() });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Impossible de charger le back-office.');
			payload = result;
			setStoredAdminAuth({ ...auth, token: result.token, record: { email: result.viewer?.email || '' } });
			shell.classList.remove('hidden');
			renderAll();
			bindFilters();
			bindCreateForms();
		} catch (error) {
			showError(error instanceof Error ? error.message : 'Impossible de charger le back-office.');
		} finally {
			loading.classList.add('hidden');
		}
	}

	document.querySelector('#admin-logout')?.addEventListener('click', () => {
		clearStoredAdminAuth();
		window.location.href = '/admin/login';
	});

	loadAdmin();
})();
