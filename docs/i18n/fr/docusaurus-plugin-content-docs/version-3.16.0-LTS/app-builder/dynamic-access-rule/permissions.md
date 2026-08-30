---
id: overview
title: Règles d'accès dynamiques
sidebar_label: Aperçu
---

<PlanBadge type="enterprise" />

Dans ToolJet, vous pouvez configurer des règles d'accès dynamiques pour créer des applications sécurisées basées sur les rôles. Vous pouvez configurer des permissions au niveau de la page, de la query, du composant et de la ligne (row) pour garantir que les utilisateurs n'accèdent qu'aux fonctionnalités et aux données qu'ils sont autorisés à utiliser.

## Quand les utiliser

1. **Applications multi-rôles** : Lorsque votre application dessert différents types d'utilisateurs (direction, managers, dirigeants, etc.) qui doivent accéder à différentes fonctionnalités, données ou tâches selon leur rôle.
2. **Protection des données sensibles** : Lorsque votre application traite des informations confidentielles comme des données financières, des dossiers personnels ou des opérations critiques pour l'entreprise, qui ne devraient être accessibles qu'au personnel autorisé.
3. **Exigences de conformité et de sécurité** : Lorsque votre organisation a des exigences réglementaires, des pistes d'audit ou des politiques de sécurité qui imposent un accès contrôlé à certaines fonctionnalités, données ou fonctions administratives.


## Types de permissions

| <div style={{ width:"150px"}}> Niveau de permission </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Quand l'utiliser </div> |
|:----------------|:------------|:---------|
| [Niveau page](/docs/app-builder/dynamic-access-rule/page-level) | Contrôle quels utilisateurs peuvent accéder à des pages spécifiques de votre application | Une page entière doit être masquée pour certains rôles |
| [Niveau query](/docs/app-builder/dynamic-access-rule/query-level) | Restreint quels utilisateurs peuvent exécuter des queries ou des appels API particuliers | Les opérations sur des données sensibles nécessitent une protection |
| [Niveau composant](/docs/app-builder/dynamic-access-rule/component-level) | Masque ou affiche des composants d'interface spécifiques selon la permission d'accès | Les utilisateurs peuvent consulter une page mais ne doivent pas interagir avec tous les éléments |
| [Row Level Security](/docs/app-builder/dynamic-access-rule/row-level-security) | Contrôle quels enregistrements un utilisateur peut voir ou avec lesquels il peut interagir dans les queries de base de données | Différents utilisateurs doivent accéder à différents sous-ensembles de données d'une même table |

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
