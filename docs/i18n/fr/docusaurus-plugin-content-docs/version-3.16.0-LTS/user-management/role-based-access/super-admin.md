---
id: super-admin
title: Super Admin
---

<PlanBadge type="team" />

Sur un ToolJet auto-hébergé, un Super Admin est l'utilisateur qui dispose d'un accès complet à tous les Workspaces, Utilisateurs et Groupes d'une instance. Une instance peut avoir plusieurs Super Admins. Un Super Admin a un contrôle total sur les workspaces des autres utilisateurs et peut créer des utilisateurs, des groupes et d'autres super admins. L'utilisateur qui crée l'instance obtient par défaut le rôle de Super Admin.

## Admin vs Super Admin

### Gestion des utilisateurs

| Privilège                                                                                                                                                                                                                                                           | Admin | Super Admin |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---: | :---------: |
| Gérer les utilisateurs de leur workspace ([Inviter](/docs/user-management/onboard-users/invite-user)/[Archiver](/docs/user-management/onboard-users/archive-user#steps-to-archive-user)/[Désarchiver](/docs/user-management/onboard-users/archive-user#steps-to-unarchive-user)) |  ✅   |     ✅      |
| [Archiver](/docs/user-management/onboard-users/archive-user#steps-to-archive-user)/[Désarchiver](/docs/user-management/onboard-users/archive-user#steps-to-unarchive-user) n'importe quel utilisateur de tous les workspaces de l'instance                                            |  ❌   |     ✅      |
| [Réinitialiser le mot de passe de n'importe quel utilisateur](/docs/user-management/profile-management/reset-password#super-admin-reset-password)                                                                                                                                                    |  ❌   |     ✅      |
| [Modifier le nom de n'importe quel utilisateur](/docs/user-management/profile-management/user-details)                                                                                                                                                                                      |  ❌   |     ✅      |
| [Rendre n'importe quel utilisateur Super Admin](#promote-a-user-to-super-admin)                                                                                                                                                                                                         |  ❌   |     ✅      |

### Gestion des workspaces

| Privilège                                                                                                                                                                                  | Admin | Super Admin |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---: | :---------: |
| Gérer les groupes de leur workspace ([Créer un groupe](/docs/user-management/role-based-access/custom-groups#creating-custom-groups)/ Ajouter ou supprimer des utilisateurs des groupes/ Modifier les permissions des groupes) |  ✅   |     ✅      |
| [Gérer le SSO](/docs/user-management/sso/overview) de leur workspace                                                                                                                        |  ✅   |     ✅      |
| [Gérer les constantes du workspace](/docs/security/constants/) de leur workspace                                                                                                                 |  ✅   |     ✅      |
| [Gérer les sources de données](/docs/data-sources/overview) pour le groupe d'utilisateurs de leur workspace                                                                                                   |  ✅   |     ✅      |
| Accéder au workspace personnel de n'importe quel utilisateur (créer/modifier/supprimer des apps)                                                                                                                             |  ❌   |     ✅      |
| Archiver un Admin ou tout utilisateur de n'importe quel workspace                                                                                                                                                 |  ❌   |     ✅      |
| Accéder à la ToolJet Database de n'importe quel utilisateur (créer/modifier/supprimer une base de données)                                                                                                                                          |  ❌   |     ✅      |
| Gérer les paramètres de n'importe quel workspace (Groupes/SSO/Constantes du workspace)                                                                                                                            |  ❌   |     ✅      |
| Gérer tous les utilisateurs de tous les workspaces de l'instance                                                                                                                                   |  ❌   |     ✅      |

### Gestion de l'instance

| Privilège                                                | Admin | Super Admin |
| -------------------------------------------------------- | :---: | :---------: |
| Gérer tous les workspaces de l'instance (Archiver/Désarchiver) |  ❌   |     ✅      |
| Restreindre la création de workspace personnel pour les utilisateurs         |  ❌   |     ✅      |
| Configurer la connexion au niveau de l'instance                           |  ❌   |     ✅      |
| Activer l'édition multi-utilisateurs (Multiplayer)                               |  ❌   |     ✅      |
| Mettre en œuvre le White Labelling                                |  ❌   |     ✅      |

## Promouvoir un utilisateur en Super Admin {#promote-a-user-to-super-admin}

Rôle requis : **Super Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Settings > All Users**. <br/>
   (Exemple d'URL - `https://app.corp.com/instance-settings/all-users`)

3. Repérez l'utilisateur dont les informations doivent être mises à jour et cliquez sur le menu kebab (trois points) situé à la fin de sa ligne.
   <img className="screenshot-full" src="/img/user-management/profile-management/user-details/edit-menu.png" alt="Edit User Details Menu" />

4. Sélectionnez **Edit user details**.

5. Activez le bouton bascule devant **Super Admin** pour promouvoir l'utilisateur en Super Admin.
   <img className="screenshot-full img-s" src="/img/user-management/profile-management/user-details/super-admin-toggle.png" alt="Super Admin Toggle" />

6. Cliquez sur **Update** en bas du panneau.
