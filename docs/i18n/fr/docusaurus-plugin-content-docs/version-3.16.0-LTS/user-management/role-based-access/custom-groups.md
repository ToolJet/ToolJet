---
id: custom-groups
title: Custom Groups
---

<PlanBadge type="team" />

ToolJet vous permet de créer des groupes personnalisés pour gérer efficacement les permissions, les accès et les utilisateurs. Chaque groupe personnalisé peut être configuré avec un ensemble spécifique de permissions et n'inclure que les utilisateurs qui ont besoin de ces permissions. Cela permet de maintenir un contrôle précis sur ce que les utilisateurs peuvent accéder et modifier au sein de votre workspace.

Par exemple, si vous avez des apps construites pour deux équipes, RH et Ventes, et que vous souhaitez que les membres de chaque équipe n'aient accès qu'aux apps pertinentes pour leur équipe, vous pouvez alors créer deux groupes personnalisés nommés RH et Ventes, puis sélectionner les apps souhaitées en configurant les **[permissions d'accès granulaire](/docs/user-management/role-based-access/access-control#granular-access-control)**.

## Création de groupes personnalisés {#creating-custom-groups}

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.
2. Allez dans **Workspace Settings** > **Groups**. <br/>
   (Exemple d'URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Cliquez sur **+ Create new group**.
4. Entrez un nom pour le groupe et cliquez sur **Create Group**.

Consultez le guide **[Contrôle d'accès](/docs/user-management/role-based-access/access-control)** pour configurer les permissions.

<img className="screenshot-full" src="/img/user-management/rbac/custom-group/new-group.png" alt="Create Custom Group" />

## Suppression d'un groupe personnalisé

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.
2. Allez dans **Workspace Settings** > **Groups**. <br/>
   (Exemple d'URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Cliquez sur le menu kebab situé à côté du groupe que vous souhaitez supprimer.
4. Sélectionnez **Delete** dans le menu déroulant et confirmez l'action dans la boîte de dialogue.

<img className="screenshot-full" src="/img/tutorial/manage-users-groups/deleting-custom-group.png" alt="Deleting Custom Group" />

## Duplication d'un groupe

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.
2. Allez dans **Workspace Settings** > **Groups**. <br/>
   (Exemple d'URL - `https://app.corp.com/nexus/workspace-settings/groups`)
3. Cliquez sur le menu kebab situé à côté du groupe que vous souhaitez dupliquer.
4. Sélectionnez **Duplicate** dans le menu déroulant et sélectionnez les parties du groupe que vous souhaitez dupliquer.
5. Cliquez sur **Duplicate** pour créer un nouveau groupe avec les permissions sélectionnées.

<img className="screenshot-full img-s" src="/img/tutorial/manage-users-groups/duplicate-group.png" alt="Duplicate Group" />

## Héritage et remplacements

- Les utilisateurs héritent des permissions de leur rôle attribué et de tous les groupes personnalisés auxquels ils appartiennent.
- L'ajout d'utilisateurs à des groupes personnalisés disposant de permissions supérieures à leur rôle actuel entraîne automatiquement une mise à niveau de leur rôle utilisateur pour correspondre au niveau d'accès supérieur.
- Si le rôle d'un utilisateur est rétrogradé vers un rôle disposant de permissions inférieures, il sera automatiquement retiré de tout groupe personnalisé lui ayant conféré un accès supérieur à celui autorisé par son nouveau rôle.
- Lorsqu'un utilisateur appartient à plusieurs groupes, il reçoit le niveau de permission le plus élevé accordé par l'un de ses groupes.
