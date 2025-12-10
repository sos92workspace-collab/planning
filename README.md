# Plateforme de choix des gardes – SOS92

Application statique (HTML/CSS/JS) prête pour GitHub Pages, connectée à Supabase pour l'authentification et le stockage des données.

## Pages
- `login.html` : connexion Supabase Auth et redirection automatique selon le rôle (`admin`, `titulaire`, `remplacant`).
- `admin.html` : gestion des fiches médecins (table `profiles`), ouverture des colonnes de planning et récapitulatif des souhaits.
- `saisie_titulaire.html` : saisie des souhaits pour les titulaires/associés.
- `saisie_remplacant.html` : saisie des souhaits limitée aux créneaux autorisés aux remplaçants.

Toutes les pages chargent `supabaseClient.js` pour partager la configuration Supabase (URL : `https://tnsjdhuulaebclvdtthh.supabase.co`, clé `sb_publishable_uGW0mWIQ94EO9zmZ56bnAA_guffQW5T`).

## Schéma Supabase
Le fichier [`schema.sql`](schema.sql) contient la structure minimale :
- `profiles` : fiche utilisateur liée à `auth.users` (rôle, email, nom, priorité).
- `shift_columns` : colonnes/ créneaux disponibles avec un indicateur `allowed_remplacant`.
- `shift_preferences` : souhaits de garde, reliés à un profil et à un créneau.

Les politiques RLS sont volontairement souples :
- Lecture des fiches : l'utilisateur lit sa propre fiche, l'admin voit tout.
- Gestion des fiches et des créneaux : uniquement les admins.
- Souhaits : chaque utilisateur crée/lit ses propres lignes.

### Mise en place
1. Appliquez `schema.sql` dans le SQL Editor Supabase.
2. Créez les utilisateurs via le dashboard Supabase Auth. Copiez l'UUID et créez la fiche correspondante dans `profiles` (admin.html propose un formulaire pour insérer en fournissant l'UUID Auth).
3. Paramétrez les colonnes de planning depuis `admin.html` (cochez `allowed_remplacant` directement dans Supabase si besoin pour limiter l'accès remplaçant).

## Déploiement GitHub Pages
1. Pousser le dépôt sur GitHub.
2. Activer GitHub Pages (branche principale, racine `/`).
3. Les URLs deviendront accessibles en HTTPS ; Supabase accepte l'origine GitHub Pages par défaut si vous ajoutez l'URL dans les paramètres Auth -> Redirect URLs.

## Notes d'utilisation
- Les formulaires utilisent des requêtes en temps réel (channel `admin-live`) pour refléter les modifications sans recharger.
- Le formulaire admin demande l'UUID de l'utilisateur (copié depuis Supabase Auth) afin d'aligner la fiche `profiles` avec le compte Supabase.
- Les pages de saisie récupèrent automatiquement l'utilisateur connecté et filtrent leurs souhaits par `profile_id`.
