# Nutrivia

**Auteur**  
Prénom : Noah  
Nom : ROGNON  
Groupe B | Dev

**Site en ligne**  
https://nutrivia.noahrognon.fr

## Présentation du projet

Nutrivia est une plateforme web dédiée à la nutrition, à l’organisation des repas et à l’accompagnement alimentaire personnalisé.

L’objectif du site est d’aider un utilisateur à :
- mieux comprendre ses besoins nutritionnels ;
- planifier ses repas ;
- suivre son alimentation au quotidien ;
- générer automatiquement sa liste de courses ;
- échanger avec la communauté ;
- bénéficier d’un accompagnement par intelligence artificielle ;
- prendre rendez-vous avec des professionnels de la nutrition ;
- accéder à un écosystème complet autour de l’alimentation et du bien-être.

Le projet a été réalisé avec :
- **Astro**
- **Tailwind CSS**
- **JavaScript / TypeScript**
- **PocketBase**
- **OpenAI API** pour certaines fonctionnalités d’IA

## Accès au site

Le site est accessible ici :  
**https://nutrivia.noahrognon.fr**

## Fonctionnement général

Le site repose sur un profil nutritionnel personnalisé. Lors de l’inscription, l’utilisateur remplit un questionnaire qui permet de définir :
- son âge ;
- sa taille ;
- son poids ;
- son objectif nutritionnel ;
- son niveau d’activité ;
- son type d’activité ;
- son régime alimentaire ;
- ses éventuelles restrictions.

À partir de ces données, Nutrivia calcule automatiquement :
- les calories journalières recommandées ;
- les apports cibles en protéines ;
- les apports cibles en glucides ;
- les apports cibles en lipides.

Toutes les fonctionnalités du site s’appuient ensuite sur ce profil.

## Fonctionnalités principales

### 1. Accueil

La page d’accueil présente l’univers du projet, les objectifs possibles, les régimes disponibles, le fonctionnement global de la plateforme et les principales fonctionnalités.

Lien :  
https://nutrivia.noahrognon.fr

### 2. Inscription / Connexion

L’utilisateur peut :
- créer un compte via un parcours d’onboarding multi-étapes ;
- se connecter à son espace ;
- construire son profil nutritionnel ;
- obtenir ses besoins journaliers calculés automatiquement.

Le parcours d’inscription permet de personnaliser l’expérience dès le départ.

Liens :
- https://nutrivia.noahrognon.fr/auth/register
- https://nutrivia.noahrognon.fr/auth/login

### 3. Profil utilisateur

La page profil centralise les informations personnelles et nutritionnelles de l’utilisateur.

L’utilisateur peut :
- consulter ses données ;
- modifier certaines informations ;
- visualiser ses objectifs ;
- voir son IMC ;
- consulter une projection de poids ;
- accéder à ses recettes favorites ;
- accéder à ses rendez-vous.

Lien :  
https://nutrivia.noahrognon.fr/profile

### 4. Tableau de bord

Le dashboard regroupe les informations clés de l’utilisateur.

Il permet de voir rapidement :
- l’objectif du jour ;
- les calories consommées ;
- les macros atteintes ;
- le planning du jour ;
- la progression hebdomadaire ;
- les récompenses ;
- les recommandations ;
- les actions rapides vers les autres modules.

Lien :  
https://nutrivia.noahrognon.fr/dashboard

### 5. Catalogue de recettes

L’utilisateur dispose d’une base de recettes filtrable.

Fonctionnalités :
- recherche de recettes ;
- filtrage par objectif ;
- filtrage par régime ;
- filtrage par calories ;
- préfiltrage automatique selon le profil de l’utilisateur connecté ;
- accès à la fiche détaillée d’une recette.

Lien :  
https://nutrivia.noahrognon.fr/recettes

### 6. Détail d’une recette

Chaque recette possède une fiche complète.

L’utilisateur peut :
- consulter la photo, la description et les tags ;
- voir les calories et les macronutriments ;
- ajuster le nombre de portions ;
- voir les ingrédients recalculés selon les portions ;
- lire les étapes de préparation ;
- consulter et ajouter des avis ;
- mettre la recette en favori ;
- ajouter la recette au suivi ;
- découvrir des recettes similaires.

Exemple de lien :  
https://nutrivia.noahrognon.fr/recette/riz-saute-crevettes

### 7. Favoris

L’utilisateur peut enregistrer ses recettes favorites depuis la fiche recette et les retrouver dans son profil.

### 8. Base d’aliments

Le site propose une base de données d’aliments avec leurs valeurs nutritionnelles.

L’utilisateur peut :
- rechercher un aliment ;
- filtrer par catégorie ;
- consulter les calories pour 100 g ;
- consulter protéines, glucides, lipides et fibres ;
- utiliser le scanner produit pour enrichir la base.

Lien :  
https://nutrivia.noahrognon.fr/aliments

### 9. Scanner intelligent

Le site dispose d’une page de scan dédiée avec deux usages :

#### Scanner un produit
- l’utilisateur importe une photo du produit ;
- l’IA extrait les données nutritionnelles ;
- une fiche préremplie est proposée ;
- l’utilisateur valide l’ajout à la base `aliments`.

#### Analyser une assiette
- l’utilisateur envoie une photo d’un repas ;
- l’IA estime les aliments présents ;
- l’IA estime les calories et les macronutriments ;
- les résultats peuvent être réutilisés dans le chat IA.

Lien :  
https://nutrivia.noahrognon.fr/scanner

### 10. Régimes alimentaires

Une page dédiée présente les différents régimes présents sur la plateforme.

Chaque régime affiche :
- une description ;
- ses avantages ;
- ses points de vigilance ;
- des aliments conseillés ;
- un accès vers les recettes liées.

Lien :  
https://nutrivia.noahrognon.fr/regimes

### 11. Suivi alimentaire

Cette page permet à l’utilisateur de suivre précisément ce qu’il mange.

Fonctionnalités :
- sélection d’un jour dans la semaine ;
- ajout de recettes consommées ;
- ajout de snacks ou aliments consommés ;
- calcul automatique des calories du jour ;
- calcul automatique des macros du jour ;
- résumé hebdomadaire ;
- comparaison aux objectifs du profil ;
- statistiques de régularité.

Lien :  
https://nutrivia.noahrognon.fr/suivi

### 12. Planificateur de repas

Le planificateur permet d’organiser toute une semaine.

L’utilisateur peut :
- visualiser sa semaine ;
- planifier petit-déjeuner, déjeuner et dîner ;
- ajouter des recettes dans chaque case ;
- supprimer ou remplacer un repas ;
- générer un menu intelligent ;
- envoyer sa semaine planifiée vers le suivi alimentaire.

Lien :  
https://nutrivia.noahrognon.fr/planificateur

### 13. Liste de courses

La liste de courses est générée automatiquement à partir du planning hebdomadaire.

Fonctionnalités :
- agrégation des ingrédients de la semaine ;
- fusion des quantités ;
- regroupement par catégories ;
- possibilité de cocher les articles ;
- possibilité d’ajouter un article manuellement ;
- suppression d’un article ;
- export PDF ;
- impression.

Lien :  
https://nutrivia.noahrognon.fr/liste-courses

### 14. Communauté

Nutrivia intègre une vraie page communautaire.

Les utilisateurs peuvent :
- publier un post ;
- ajouter une image ;
- ajouter une description ;
- ajouter des hashtags ;
- lier une recette du site à une publication ;
- liker une publication ;
- commenter ;
- liker des commentaires ;
- filtrer par publications récentes ou populaires.

Lien :  
https://nutrivia.noahrognon.fr/communaute

### 15. Assistant IA

L’assistant IA est un module central du projet.

Il permet à l’utilisateur de :
- poser des questions sur la nutrition ;
- poser des questions sur le sport et l’alimentation ;
- demander des recettes adaptées à ses objectifs ;
- demander un menu ou une planification ;
- demander des substitutions d’aliments ;
- analyser ses habitudes ;
- scanner un produit depuis l’interface de chat ;
- analyser une assiette ;
- co-construire une recette avec l’IA ;
- ajouter une recette construite avec l’IA dans la base de données du site.

L’assistant est contextualisé selon :
- le profil nutritionnel ;
- les objectifs ;
- les habitudes ;
- les recettes disponibles ;
- les aliments présents dans la base ;
- le planning et le suivi utilisateur.

Lien :  
https://nutrivia.noahrognon.fr/assistant

### 16. Professionnels de la nutrition

Le site permet la mise en relation avec des professionnels.

L’utilisateur peut :
- consulter la liste des professionnels ;
- filtrer par spécialité ;
- voir une fiche détaillée ;
- consulter les disponibilités ;
- réserver un créneau ;
- recevoir une confirmation ;
- retrouver ses rendez-vous.

Liens :
- https://nutrivia.noahrognon.fr/professionnels
- https://nutrivia.noahrognon.fr/mes-rendez-vous

### 17. Espace professionnel

Un professionnel dispose d’un espace dédié.

Il peut :
- créer ou compléter son profil professionnel ;
- définir ses disponibilités ;
- supprimer des créneaux ;
- consulter ses rendez-vous à venir.

Lien :  
https://nutrivia.noahrognon.fr/espace-pro

### 18. Back-office administrateur

Le site intègre un back-office admin complet.

Connexion admin :  
https://nutrivia.noahrognon.fr/admin/login

Le back-office permet :
- d’accéder à des statistiques globales ;
- de gérer les utilisateurs ;
- de modifier les rôles ;
- de valider ou refuser des recettes ;
- de valider ou refuser des aliments ;
- d’ajouter manuellement des recettes ;
- d’ajouter manuellement des aliments ;
- de modérer les publications et commentaires ;
- de masquer ou supprimer des contenus ;
- de gérer les professionnels ;
- de valider ou refuser des profils professionnels ;
- de consulter les rendez-vous.

Lien :  
https://nutrivia.noahrognon.fr/admin

## Ce que peut faire un utilisateur sur Nutrivia

Un utilisateur peut :
- créer son compte ;
- construire son profil nutritionnel ;
- recevoir des objectifs personnalisés ;
- consulter son tableau de bord ;
- suivre son alimentation ;
- planifier ses repas ;
- générer une liste de courses ;
- découvrir des recettes adaptées ;
- mettre des recettes en favoris ;
- rejoindre la communauté ;
- utiliser l’assistant IA ;
- scanner un produit ;
- analyser une assiette ;
- prendre rendez-vous avec un professionnel ;
- consulter ses rendez-vous.

## Ce que peut faire un professionnel

Un professionnel peut :
- avoir un espace dédié ;
- définir ses disponibilités ;
- consulter ses rendez-vous à venir ;
- gérer son profil professionnel.

## Ce que peut faire un administrateur

L’administrateur peut :
- piloter l’ensemble du site ;
- valider du contenu ;
- modérer la communauté ;
- gérer les professionnels ;
- gérer les utilisateurs ;
- ajouter ou corriger des contenus ;
- suivre les indicateurs clés de la plateforme.

## Valeur ajoutée du projet

Nutrivia ne se limite pas à un simple catalogue de recettes.

Le projet propose un écosystème complet qui relie :
- le profil utilisateur ;
- les besoins nutritionnels ;
- les recettes ;
- les aliments ;
- le planning ;
- le suivi ;
- la liste de courses ;
- la communauté ;
- les professionnels ;
- l’intelligence artificielle ;
- le back-office.

Cette cohérence globale est l’une des forces principales du projet.

## Conclusion

Nutrivia est une plateforme complète de nutrition personnalisée qui vise à accompagner l’utilisateur dans toutes les dimensions de son alimentation :
- comprendre ;
- organiser ;
- suivre ;
- adapter ;
- échanger ;
- se faire accompagner.

Le projet a été pensé pour offrir une expérience riche, moderne, interactive et reliée à une vraie logique de données.
