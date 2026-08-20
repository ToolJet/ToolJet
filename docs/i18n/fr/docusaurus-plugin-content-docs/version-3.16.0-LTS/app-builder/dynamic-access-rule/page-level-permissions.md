---
id: page-level
title: Permissions au niveau des pages
---

<PlanBadge type="enterprise" />

Les permissions de page contrôlent qui peut accéder à une page donnée de votre application. Lorsqu'un utilisateur n'a pas la permission d'accéder à une page, il ne pourra pas y naviguer.

:::note
1. Si l'utilisateur tente d'accéder à une page restreinte, il sera redirigé vers la page d'accueil si celle-ci est accessible, sinon il sera redirigé vers la prochaine page accessible.
2. L'utilisateur ne pourra pas accéder à l'application elle-même si toutes les pages sont inaccessibles.
3. Pour les applications publiées publiquement, seules les pages non restreintes seront accessibles à tous. Les pages restreintes ne seront accessibles à personne, y compris aux utilisateurs ou groupes d'utilisateurs qui y ont normalement accès.
:::

## Cas d'utilisation courants

- **Pages administratives** : Restreindre l'accès aux pages liées à l'administration uniquement aux utilisateurs autorisés.
- **Tableaux de bord spécifiques à un département** : Créer des pages distinctes pour les Ventes, le Marketing, les RH, accessibles uniquement aux équipes concernées.
- **Rapports sensibles** : Masquer les rapports financiers, les journaux d'audit ou les pages de conformité aux utilisateurs non autorisés.

## Scénarios

- Lorsque des sections entières de votre application ne doivent pas être accessibles à certains rôles d'utilisateur.
- Lorsque vous devez créer des pages d'accueil ou des tableaux de bord spécifiques à un rôle.
- Lorsque la conformité exige une séparation complète de certaines fonctionnalités.

## Configurer les permissions au niveau des pages

**Rôle requis** : Admin ou Builder

1. Accédez à l'application pour laquelle vous souhaitez configurer la permission de page.
2. Cliquez sur le menu kebab (trois points) à côté du nom de la page et sélectionnez **Page permission**.
   <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/permissions/page-permission.png" alt="Page Permission" />
3. Choisissez votre type de permission :
    - **All users with access to the app** : Accorde l'accès à tous les utilisateurs qui peuvent accéder à l'application.
    - **Users** : Sélectionnez des utilisateurs spécifiques dans la liste déroulante (seuls les utilisateurs ayant accès à l'application seront affichés dans la liste).
    - **User groups** : Restreint l'accès aux membres des groupes d'utilisateurs sélectionnés (seuls les rôles d'utilisateur par défaut et les groupes personnalisés ayant accès à l'application seront affichés dans la liste).
   <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/permissions/page-modal.png" alt="Page Permission Modal" />

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
