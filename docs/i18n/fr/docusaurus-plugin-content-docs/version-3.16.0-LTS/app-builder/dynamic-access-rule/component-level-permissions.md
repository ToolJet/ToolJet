---
id: component-level
title: Permissions au niveau des composants
---

<PlanBadge type="enterprise" />

Les permissions au niveau des composants contrôlent quels éléments de l'interface utilisateur les utilisateurs peuvent voir et avec lesquels ils peuvent interagir. Les composants pour lesquels les utilisateurs n'ont pas la permission d'accès ne s'afficheront pas du tout dans leur interface.

:::note Applications publiques 
Pour les applications publiées publiquement, seuls les composants non restreints seront accessibles à tous. Les composants restreints ne seront accessibles à personne, y compris aux utilisateurs ou groupes d'utilisateurs qui y ont normalement accès.
:::

## Cas d'utilisation courants

- **Boutons d'action sensibles** : Masquer les boutons d'action tels que **Edit**, **Delete** et **Approve** aux utilisateurs qui ne sont pas autorisés à effectuer ces actions.
- **Affichage d'informations sensibles** : Masquer les champs de salaire, les informations personnelles ou les données confidentielles aux personnes non autorisées.

## Scénarios

- Lorsque les utilisateurs peuvent consulter une page mais ne devraient interagir qu'avec certains éléments spécifiques.
- Lors de la création d'applications multi-tenant où différents tenants voient des éléments d'interface différents.

## Configurer les permissions au niveau des composants

**Rôle requis** : Admin ou Builder

1. Sélectionnez le composant, puis cliquez sur le menu kebab (trois points) à côté du nom du composant dans le panneau des propriétés.

<img className="screenshot-full img-l" style={{ marginBottom: '15px' }} src="/img/app-builder/components/permission-kebab.png" alt="Component Permission Kebab Menu"/>

2. Sélectionnez **Component permission**.

<img className="screenshot-full img-s" style={{ marginBottom: '15px' }} src="/img/app-builder/components/component-permission.png" alt="Component Permission Option"/>

3. Sélectionnez le **Type** :

- **All users with access to the app** : Accorde l'accès à tous les utilisateurs qui peuvent accéder à l'application.

- **Users** : Sélectionnez des utilisateurs spécifiques dans la liste déroulante. Remarque : ces utilisateurs doivent déjà avoir accès à l'application.

- **User groups** : Restreint l'accès aux membres des groupes d'utilisateurs sélectionnés. Remarque : les groupes d'utilisateurs sélectionnés doivent avoir accès à l'application.

<img className="screenshot-full img-s" style={{ marginBottom: '15px' }} src="/img/app-builder/components/permission-type.png" alt="Permission Type Selection"/>

:::note
Si un admin restreint un composant sans inclure le builder dans les utilisateurs ou groupes autorisés, le builder perdra l'accès pour modifier ou changer les permissions de ce composant. Cela permet d'empêcher les builders de contourner les politiques de sécurité établies par les administrateurs. Pour retrouver l'accès, le builder doit être explicitement ajouté aux utilisateurs/groupes autorisés par l'admin.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
