---
id: workspaces
title: Workspaces
---
# Workspaces

Les workspaces sont des environnements collaboratifs qui permettent aux équipes de créer, personnaliser et déployer des applications, ainsi que de gérer les données, les workflows et les permissions. Ils vous aident à organiser les applications de votre organisation selon une hiérarchie ou des départements, ce qui facilite leur gestion. Par exemple, si votre organisation possède plusieurs départements, vous pouvez créer un workspace distinct pour chacun afin d'isoler les applications ou de limiter l'accès à un ensemble spécifique d'utilisateurs ou de développeurs.

Un workspace contient des applications, des sources de données, des utilisateurs (admins, développeurs ou builders, utilisateurs finaux), des paramètres d'[accès et de permissions](/docs/user-management/role-based-access/access-control), et bien plus encore. Vous pouvez également définir différentes [configurations de connexion](/docs/user-management/authentication/self-hosted/overview) pour chaque workspace. Vous pouvez avoir plusieurs workspaces au sein d'une même instance.

## Création d'un workspace

**Rôle requis** - Workspace Admin

Pour créer un nouveau workspace,

1.  Ouvrez le menu déroulant des workspaces en bas à gauche du dashboard (Exemple d'URL - `https://app.corp.com/<workspace-slug>`)
2.  Sélectionnez **Add a new workspace**.
3.  Renseignez le nom et le slug du workspace dans la fenêtre modale.
4.  Cliquez sur **Create workspace**.

<img className="screenshot-full img-l" src="/img/tooljet-setup/workspace/create-workspace.png" alt="Create workspace" />

## Modification des workspaces
**Rôle requis** - Workspace Admin

Pour modifier un workspace,

1. Ouvrez le menu déroulant des workspaces en bas à gauche du dashboard (Exemple d'URL - `https://app.corp.com/<workspace-slug>`)
2. Survolez le **workspace actuel** dans le menu déroulant.
3.  Cliquez sur l'**icône de modification** pour changer le nom ou le slug du workspace.
4.  Enregistrez les modifications, et les mises à jour seront immédiatement reflétées sur toute la plateforme.

## Changer de workspace

Pour basculer entre les workspaces,

1.  Ouvrez le menu déroulant des workspaces en bas à gauche du dashboard (Exemple d'URL - `https://app.corp.com/<workspace-slug>`)
2.  Sélectionnez le workspace souhaité dans la liste pour basculer instantanément.
<img className="screenshot-full img-s" src="/img/tooljet-setup/workspace/switch-workspace.png" alt="Archive workspace" />

## Archivage des workspaces
**Rôle requis** - Super Admin

-   Cette fonctionnalité est disponible uniquement pour les utilisateurs auto-hébergés, et seul le [Super Admin](/docs/user-management/role-based-access/super-admin) peut archiver des workspaces. Un Super Admin est l'utilisateur qui a un accès complet à tous les workspaces, utilisateurs et groupes d'une instance.
-   Pour archiver un workspace, au moins un workspace actif doit exister dans l'instance.

-   **Impact**
    -   Les applications au sein du workspace archivé ne seront plus accessibles via l'URL.
    -   Les utilisateurs n'ayant accès à aucun workspace actif seront déconnectés.

-   Pour archiver un workspace :

1.  Allez dans **Settings** > **All Workspaces**. ( Exemple d'URL - `https://app.corp.com/instance-settings/all-workspaces`)
2.  Un tableau listant tous les workspaces apparaîtra.
3.  Cliquez sur le bouton Archive pour ouvrir une fenêtre de confirmation. Une fois confirmé, le workspace sélectionné sera archivé.


<img className="screenshot-full img-l" src="/img/tooljet-setup/workspace/archive-workspace.png" alt="Archive workspace" />

## Désarchiver un workspace

**Rôle requis** - Super Admin

-   Pour désarchiver un workspace :

1.  Allez dans **Settings** > **All Workspaces**. ( Exemple d'URL - `https://app.corp.com/instance-settings/all-workspaces`)
2.  Un tableau affichant tous les workspaces apparaîtra. Cliquez sur l'onglet Archived pour voir les workspaces archivés.
3.  Cliquez sur le bouton Unarchive pour désarchiver le workspace sélectionné.

## Workspace par défaut

**Rôle requis** - Super Admin

Le workspace par défaut dans ToolJet simplifie l'intégration des équipes. Une fois configuré, les nouveaux utilisateurs peuvent s'inscrire via l'URL principale de l'entreprise (instance) et être ajoutés automatiquement au workspace par défaut. Cela élimine la nécessité de partager et de maintenir de longues URL de workspace pour les configurations à workspace unique.

Le premier workspace créé par le super admin sera désigné comme le workspace par défaut. Pour mettre à jour le workspace par défaut de votre instance, allez dans **Settings** > **All workspaces**. Vous y trouverez un menu déroulant intitulé *Default Workspace*. Sélectionnez ici le workspace que vous souhaitez désigner comme workspace par défaut.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/tooljet-setup/workspace/default-workspace.png" alt="Set default workspace" />

Lors de la configuration des paramètres de connexion pour votre instance, assurez-vous d'activer l'option Enable Signup. Une fois activée, vous pouvez partager l'URL de votre instance (par exemple, `https://app.corp.com`) pour inviter des utilisateurs à s'inscrire.

Veillez à partager l'URL complète de l'instance, qu'il s'agisse d'un sous-domaine, d'un sous-chemin ou d'un domaine personnalisé complet. Toute personne s'inscrivant via ce lien sera ajoutée au workspace par défaut.

:::note
Le workspace par défaut ne peut pas être archivé. Veuillez définir un autre workspace comme workspace par défaut avant de procéder à l'archivage de celui-ci.
:::


## Workspace Admin

-   Un workspace dispose de trois rôles prédéfinis, Admins, Builders et Endusers, avec des permissions prédéfinies. Consultez la documentation [utilisateurs et groupes](/docs/user-management/role-based-access/user-roles) pour plus de détails.
-   L'utilisateur qui crée un workspace en devient automatiquement l'**Admin**.
-   Un **Admin** peut :
    -   Gérer les utilisateurs, groupes, données et applications au sein de chaque workspace.
    -   Configurer les méthodes d'authentification pour leurs workspaces.

L'utilisateur Admin a accès à toutes les permissions au niveau du workspace, tandis qu'un utilisateur final ne peut que consulter et utiliser les applications publiées auxquelles il a accès, et les permissions peuvent être configurées pour un builder.

|          Permission           | Admin | Builder | End User |
|:------------------------------|:-----:|:-------:|:--------:|
| App                           |  ✅   | Configurable |    ❌    | 
| Sources de données            |  ✅   | Configurable |    ❌    |
| Dossier                       |  ✅   | Configurable |    ❌    |
| Constantes/variables de workspace |  ✅   | Configurable |    ❌    |


## FAQ

<details id="tj-dropdown">

<summary> Les applications et les paramètres de workspace peuvent-ils être partagés entre workspaces ?</summary>

**Non**, les applications et les paramètres de workspace ne peuvent pas être partagés directement entre workspaces. Chaque workspace fonctionne de manière indépendante, en conservant ses propres applications et configurations. Cependant, vous pouvez **exporter une application** depuis un workspace et l'**importer** dans un autre. Pour plus de détails, consultez la documentation [Importer et exporter des applications](/docs/development-lifecycle/import-export/importing-exporting-applications).

</details>

<details id="tj-dropdown">
    <summary>
Les utilisateurs ont-ils accès à tous les workspaces par défaut ?
    </summary>
**Non**, les utilisateurs doivent être **invités** à un workspace spécifique pour accéder aux applications et aux données qu'il contient. Consultez la documentation [inviter des utilisateurs](/docs/user-management/role-based-access/user-roles) pour plus de détails.

</details>

