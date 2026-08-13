---
id: query-level
title: Permissions au niveau des queries
---

<PlanBadge type="enterprise" />

Les permissions au niveau des queries vous permettent de contrôler quels utilisateurs peuvent exécuter des queries spécifiques. Ceci est essentiel pour protéger les opérations sur des données sensibles et garantir que seuls les utilisateurs autorisés peuvent exécuter des queries.

:::note
Pour les applications publiées publiquement, seules les queries non restreintes seront accessibles à tous. Les queries restreintes ne seront accessibles à personne, y compris aux utilisateurs ou groupes d'utilisateurs qui y ont normalement accès.
:::

## Cas d'utilisation courants

- **Opérations de modification de données** : Restreindre les queries CREATE, UPDATE, DELETE aux seuls utilisateurs autorisés.
- **Accès aux données sensibles** : Limiter l'accès aux queries qui récupèrent des informations personnelles, des données financières ou des dossiers confidentiels.
- **Fonctions administratives** : Contrôler les queries qui gèrent les comptes utilisateurs, les paramètres système ou les données de configuration.
- **Données départementales** : Restreindre les queries RH à l'équipe RH, les queries Ventes à l'équipe Ventes.
- **Audit et conformité** : Limiter l'accès aux queries qui génèrent des pistes d'audit ou des rapports de conformité.

## Scénarios

- Lorsque vous avez besoin d'un contrôle granulaire sur qui peut exécuter des opérations spécifiques.
- Lorsque différents rôles d'utilisateur doivent accéder à différents ensembles de données provenant des mêmes tables.
- Lorsque vous souhaitez empêcher toute modification accidentelle de données en restreignant les opérations d'écriture.

## Configurer les permissions au niveau des queries

**Rôle requis** : Admin ou Builder

1. Sélectionnez la query, puis cliquez sur le menu kebab (trois points) à côté du nom de la query dans le panneau des queries. <br/>
    <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/connecting-with-datasouces/query-permission-kebab.png" alt="Query Permission Kebab Menu"/>
2. Sélectionnez **Query permission**. <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/connecting-with-datasouces/query-permission.png" alt="Query Permission Option"/>
3. Sélectionnez le **Type** :
    - **All users with access to the app** : Accorde l'accès à tous les utilisateurs qui peuvent accéder à l'application.
    - **Users** : Sélectionnez des utilisateurs spécifiques dans la liste déroulante (seuls les utilisateurs ayant accès à l'application seront affichés dans la liste).
    - **User groups** : Restreint l'accès aux membres des groupes d'utilisateurs sélectionnés (seuls les rôles d'utilisateur par défaut et les groupes personnalisés ayant accès à l'application seront affichés dans la liste).
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/connecting-with-datasouces/permission-type.png" alt="Permission Type Selection"/>

:::note
Si un admin restreint une query sans inclure le builder dans les utilisateurs ou groupes autorisés, le builder perdra l'accès pour exécuter, modifier ou changer les permissions de cette query. Cela permet d'empêcher les builders de contourner les politiques de sécurité établies par les administrateurs. Pour retrouver l'accès, le builder doit être explicitement ajouté aux utilisateurs/groupes autorisés par l'admin.
:::

## Gérer les scénarios d'accès refusé

Lorsqu'un utilisateur tente d'exécuter une query pour laquelle il n'a pas la permission d'accès, l'admin peut configurer la gestion des erreurs en suivant les étapes suivantes :

1. Accédez à Settings > Event handler de la query.
2. Ajoutez un event handler Query Failure.
3. Dans la propriété **Run Only If**, ajoutez : `{{queries.<query_name>.response.statusCode === 401}}`.
4. Configurez les actions appropriées comme l'affichage d'un message d'erreur, la redirection des utilisateurs, ou la journalisation de la tentative d'accès.
   <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/permissions/query-denied.png" alt="Query Permission Denied Handling" />

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
