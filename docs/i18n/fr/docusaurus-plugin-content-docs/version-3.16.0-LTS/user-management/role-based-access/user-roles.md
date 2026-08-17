---
id: user-roles
title: User Roles
---

ToolJet vous permet d'utiliser un système de contrôle d'accès basé sur les rôles (RBAC) pour gérer la sécurité et l'accès à vos ressources telles que les apps, les sources de données et les variables de workspace, etc. ToolJet fournit un ensemble de rôles utilisateur prédéfinis ainsi que la possibilité de créer des **[groupes personnalisés](/docs/user-management/role-based-access/custom-groups)** pour un contrôle d'accès plus granulaire. Les rôles utilisateur sont pris en compte à des fins de licence et de facturation ; consultez la **[tarification ToolJet](https://www.tooljet.com/pricing)** pour plus d'informations.

## Rôles utilisateur par défaut {#default-user-roles}

ToolJet dispose de trois rôles utilisateur par défaut au niveau du workspace, chacun avec des niveaux d'accès différents :

1. **Admin** : Un admin est un utilisateur ayant accès à la gestion des paramètres, au contrôle des permissions des utilisateurs et à la supervision du fonctionnement global. L'utilisateur admin dispose d'un accès complet à toutes les ressources.
2. **Builder** : Un builder est un utilisateur responsable de la création, de la personnalisation et de la configuration de l'application.
3. **End-user** : Un utilisateur final (end-user) est un consommateur qui interagit avec l'application finale pour effectuer des tâches ou atteindre des objectifs spécifiques.

## Permissions par rôle utilisateur {#permissions-for-user-roles}

L'utilisateur admin a accès à toutes les permissions au niveau du workspace, tandis qu'un utilisateur final ne peut que consulter et utiliser les apps publiées pour lesquelles il dispose d'un accès, et les permissions peuvent être configurées pour un builder.

| Ressource                          | Permission             | Admin | Builder | End User |
| :-------------------------------- | :--------------------- | :---: | :-----: | :------: |
| **Apps**                          | Create/Delete          | ✅                      | Configurable            | ❌                                  |
|                                   | Edit                   | ✅                      | Configurable            | ❌                                  |
|                                   | View                   | ✅                      | Configurable            | Configurable                        |
|                                   | Promote                | ✅                      | Configurable            | ❌                                  |
|                                   | Release                | ✅                      | Configurable            | ❌                                  |
|                                   | Environnements (par défaut) | Tous les environnements (Edit) | Tous les environnements (Edit) | Production uniquement (View de l'app publiée) |
| **Modules**                       | Create/Delete          | ✅                      | Configurable            | ❌                                  |
|                                   | Edit/Build with        | ✅                      | Configurable            | Non applicable                      |
| **Data sources**                  | Create/Delete          | ✅                      | Configurable            | ❌                                  |
|                                   | Configure/Build with   | ✅                      | Configurable            | Non applicable                      |
| **Folder**                        | Create/Delete          | ✅                      | Configurable            | ❌                                  |
| **Workspace constants/variables** | Create/Update/Delete   | ✅                      | Configurable            | ❌                                  |
| **Workflow**                      | Create/Delete          | ✅                      | Configurable            | ❌                                  |


## Gérer les rôles utilisateur

Dans ToolJet, les rôles utilisateur peuvent être mis à jour facilement ; suivez ces étapes pour mettre à jour un rôle utilisateur :

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Workspace settings > Users**. <br/> 
    (Exemple d'URL - `https://app.corp.com/nexus/workspace-settings/users`)

3. Repérez l'utilisateur dont le rôle doit être mis à jour et cliquez sur le menu kebab situé à la fin de sa ligne.
    <img className="screenshot-full" src="/img/user-management/rbac/user-roles/edit-user-menu.png" alt="Workspace Level Permissions" />

4. Cliquez sur **Edit user details** ; un panneau latéral droit apparaîtra.

5. Mettez à jour le rôle depuis le menu déroulant User groups.
    <img className="screenshot-full img-m" src="/img/user-management/rbac/user-roles/update-user-role.png" alt="Workspace Level Permissions" />

6. Cliquez sur le bouton **Update** présent en bas du panneau.

7. Lisez et acceptez l'avertissement de la fenêtre contextuelle en cliquant sur le bouton **Continue**.
    <img className="screenshot-full img-s" src="/img/user-management/rbac/user-roles/warning.png" alt="Workspace Level Permissions" />

8. Le rôle de cet utilisateur sera mis à jour.
