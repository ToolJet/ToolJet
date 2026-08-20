---
id: group-admin-role
title: Rôle Group Admin
---

:::warning BETA
Le rôle Group Admin est actuellement en beta et n'est pas recommandé pour un usage en production.
:::

Dans les grandes organisations, les ressources d'un workspace comme les applications, les sources de données et les modules sont souvent organisées en groupes personnalisés par projet ou par équipe. La configuration des ressources — quelles applications et sources de données un groupe peut accéder — est généralement gérée par les équipes DevOps ou IT. L'appartenance quotidienne (qui appartient à quel groupe) est souvent déléguée à des chefs d'équipe tels que des Engineering Managers ou des Product Managers. Ces deux responsabilités sont volontairement séparées.

Le rôle **Group Admin** est conçu exactement pour cette séparation. Un Group Admin peut gérer l'appartenance des utilisateurs au sein de groupes personnalisés spécifiques — en ajoutant ou en supprimant des utilisateurs à mesure que les équipes évoluent — sans avoir accès à la modification des permissions du groupe ou de tout autre paramètre du workspace. Cela permet de gérer les mouvements d'utilisateurs de manière opérationnelle tout en laissant le contrôle des ressources aux administrateurs du workspace.

## Workspace Admin vs Group Admin

| Capacité | Workspace Admin | Group Admin |
|---|:---:|:---:|
| Inviter de nouveaux utilisateurs dans le workspace | ✓ | ✗ |
| Modifier le rôle d'un utilisateur | ✓ | ✗ |
| Créer, supprimer ou renommer des groupes personnalisés | ✓ | ✗ |
| Gérer les permissions des groupes | ✓ | ✗ |
| Attribuer ou retirer des Group Admins | ✓ | ✗ |
| Ajouter des utilisateurs aux groupes personnalisés assignés | ✓ | ✓ |
| Retirer des utilisateurs des groupes personnalisés assignés | ✓ | ✓ |
| Voir l'onglet des permissions des groupes assignés | ✓ | Lecture seule |
| Voir tous les groupes personnalisés | ✓ | Groupes assignés uniquement |
| Accéder aux paramètres du workspace | ✓ | Groupes et thèmes uniquement |

## Ce qu'un Group Admin peut faire

Un Group Admin peut effectuer les actions suivantes au sein des groupes personnalisés qui lui sont assignés :

- Ajouter des utilisateurs existants du workspace au groupe
- Retirer des utilisateurs du groupe
- Voir l'onglet **Permissions** du groupe (lecture seule)
- Voir les groupes de rôles par défaut des utilisateurs (Admin, Builder, End User) pour vérifier le rôle d'un utilisateur

## Ce qu'un Group Admin ne peut pas faire

Les Group Admins disposent d'un accès volontairement limité :

- Ne peuvent pas inviter de nouveaux utilisateurs dans le workspace
- Ne peuvent pas modifier le rôle d'un utilisateur
- Ne peuvent pas créer, supprimer ou renommer des groupes personnalisés
- Ne peuvent pas gérer les Group Admins de leur groupe (ne peuvent pas ajouter ou retirer d'autres Group Admins)
- Ne peuvent pas voir les groupes personnalisés pour lesquels ils ne sont pas assignés en tant que Group Admin, même s'ils sont membres de ce groupe
- Ne peuvent pas accéder à d'autres paramètres du workspace en dehors des onglets Groupes et Thèmes

:::note
Les onglets Groupes et Thèmes sont accessibles à tous les builders par défaut. Les Group Admins ne reçoivent aucun accès supplémentaire aux paramètres du workspace au-delà de cela.
:::

## Qui peut être Group Admin

Seuls les **Builders** peuvent être assignés en tant que Group Admins. Les End Users ne peuvent pas détenir ce rôle. Si vous tentez d'assigner un End User comme Group Admin, ToolJet vous invitera d'abord à le convertir en Builder.

## Quels groupes peuvent avoir un Group Admin

Les Group Admins ne peuvent être assignés qu'à des **groupes d'utilisateurs personnalisés**. Les trois groupes de rôles par défaut — Admin, Builder et End User — ne peuvent pas avoir de Group Admins. Ces groupes sont liés à la licence et à la gestion des rôles au niveau du workspace, ce qui reste de la responsabilité d'un Workspace Admin.

## Attribuer un Group Admin

Seul un **Workspace Admin** ou un **Super Admin** peut attribuer ou retirer des Group Admins.

Pour attribuer un Group Admin à un groupe personnalisé :

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.
2. Allez dans **Workspace Settings** > **Groups**.
3. Sélectionnez le groupe personnalisé que vous souhaitez configurer.
4. Cliquez sur l'onglet **Group Admin**.
5. Recherchez le builder que vous souhaitez assigner et cliquez sur **Add**.

Pour retirer un Group Admin, allez dans le même onglet **Group Admin** et retirez-le de la liste.

## Comment les Group Admins gèrent les utilisateurs

Une fois assigné, un Group Admin peut accéder directement aux paramètres de son groupe depuis le workspace. Il verra ses groupes assignés listés sous **Workspace Settings** > **Groups**, avec un accès limité à l'onglet **Users** pour chaque groupe.

Pour ajouter un utilisateur au groupe :

1. Allez dans **Workspace Settings** > **Groups**.
2. Sélectionnez le groupe.
3. Dans l'onglet **Users**, recherchez l'utilisateur par nom ou par email.
4. Cliquez sur **Add** pour l'inclure dans le groupe.

Pour retirer un utilisateur du groupe :

1. Allez dans **Workspace Settings** > **Groups**.
2. Sélectionnez le groupe.
3. Dans l'onglet **Users**, localisez l'utilisateur et cliquez sur **Remove**.

:::note
Les Group Admins ne peuvent ajouter que des utilisateurs qui existent déjà dans le workspace. Inviter de nouveaux utilisateurs est une action réservée au Workspace Admin.
:::

## Journaux d'audit

Tous les ajouts et retraits d'utilisateurs effectués par un Group Admin sont enregistrés dans les journaux d'audit du workspace. Chaque entrée capture l'action, l'utilisateur concerné et le rôle de la personne qui l'a effectuée (par exemple, Group Admin, Workspace Admin, Super Admin).

## Limitations

- Le support API pour la gestion des Group Admins n'est pas encore disponible.
- Les Group Admins ne peuvent pas être assignés aux groupes de rôles par défaut (Admin, Builder, End User).
- Un Group Admin ne peut pas voir les groupes dont il est membre mais pour lesquels il n'est pas assigné en tant que Group Admin.
- Les End Users doivent être convertis en Builders avant de pouvoir être assignés comme Group Admins.
