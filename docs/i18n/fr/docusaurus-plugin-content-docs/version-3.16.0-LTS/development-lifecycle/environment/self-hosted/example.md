---
id: example-configuration
title: Exemple de Configuration
---

Ce guide vous accompagne dans la mise en place d'un environnement multiple dans ToolJet à l'aide d'un exemple pratique. Imaginez **Nexora Enterprises**, une entreprise qui développe une application interne avec ToolJet.

## Configuration de la Source de Données

Dans ToolJet, vous pouvez configurer des sources de données pour chaque environnement, permettant à votre application de se connecter à différentes bases de données ou API selon l'environnement.

Dans ce cas, l'entreprise utilise des données provenant d'une source de données Postgres pour ses applications ToolJet, avec des bases de données distinctes pour les environnements de développement, de staging et de production. Elle doit configurer la source de données Postgres pour chaque environnement dans la section Sources de Données. Pour plus de détails, consultez la documentation [Source de Données](/docs/data-sources/overview).

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/selfhosted-datasource.png" alt="self-hosted-env-concept" />

## Configuration des Constantes

L'entreprise utilise également différentes constantes globales et secrètes pour chaque environnement. Les Constantes Globales sont des valeurs réutilisables qui peuvent être appliquées de manière cohérente à travers le produit, tandis que les Secrets servent à stocker de manière sécurisée des données sensibles. Celles-ci peuvent être configurées dans la section Constantes de l'Espace de Travail. Pour plus de détails, consultez la documentation [Constantes de l'Espace de Travail et Secrets](/docs/security/constants/).

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/selfhosted-constants.png" alt="self-hosted-env-concept" />

## Configuration Multi-Environnement dans ToolJet
- L'entreprise peut configurer les sources de données et les constantes pour chaque environnement, et ToolJet utilisera automatiquement celles qui correspondent à l'environnement cible.
- Les développeurs peuvent désormais commencer à créer des applications dans l'**environnement de développement**, où ils créent et itèrent sur de nouvelles fonctionnalités. Dans cet environnement, ils ont accès à la base de données de développement, configurée lors de la mise en place de la source de données.
- Une fois l'application prête, elle passe à l'**environnement de staging**, où l'équipe QA la teste minutieusement. Si des bugs ou des retours apparaissent, les développeurs créent une nouvelle version, apportent les modifications nécessaires, puis font remonter l'application mise à jour vers le staging pour des tests supplémentaires.
- Les sources de données de chaque environnement seront connectées selon la configuration définie à l'étape précédente.
- Pour plus de détails sur la gestion des versions, consultez la [Documentation sur le Contrôle de Version](/docs/development-lifecycle/release/version-control).
- Après des tests réussis, l'application est promue en **production** et publiée, la rendant disponible pour les utilisateurs finaux. Cet environnement utilise la base de données de production configurée lors de la configuration de la source de données.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/draft-version/appbuilder.png" alt="self-hosted-env-concept" />
