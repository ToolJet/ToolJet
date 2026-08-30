---
id: overview
title: Aperçu
---

Ce guide décrit le cycle de vie de développement des déploiements ToolJet, en expliquant son importance et la manière dont ToolJet le gère efficacement.

Un cycle de vie de développement (également appelé cycle de vie du développement logiciel ou SDLC) est un cadre structuré qui garantit que les logiciels sont conçus, déployés et maintenus efficacement. Il aide les équipes à gérer les changements, à collaborer efficacement et à maintenir la stabilité des environnements de production. Un cycle de vie de développement bien défini améliore la qualité du logiciel, augmente l'efficacité, facilite une meilleure collaboration entre les équipes, réduit les coûts en détectant les problèmes tôt, et garantit une maintenabilité à long terme.

## Cycle de vie de développement dans ToolJet

ToolJet permet aux équipes de gérer efficacement les modifications d'applications et les déploiements grâce à son système de gestion des environnements et des versions. Les aspects clés de la gestion du cycle de vie de développement dans ToolJet incluent :

### Gestion des déploiements 

Grâce à la gestion des déploiements de ToolJet, vous pouvez créer plusieurs **[versions](/docs/development-lifecycle/release/version-control)** de votre application. ToolJet prend en charge deux types de versions pour vous aider à gérer efficacement les modifications d'application : les versions brouillon et les versions enregistrées. Ces versions garantissent que le travail de développement reste isolé jusqu'à ce que vous soyez prêt à déployer, tester ou publier des mises à jour.

- Les versions brouillon sont des copies de travail modifiables où toutes les modifications sont effectuées. Les brouillons vous permettent d'expérimenter, d'itérer et d'affiner votre application sans affecter les environnements déployés.
- Les versions enregistrées sont des points de contrôle finalisés créés à partir des brouillons. Les versions enregistrées sont figées, ne peuvent pas être modifiées, et peuvent être promues vers la préproduction ou la production, publiées auprès des utilisateurs, ou utilisées pour une restauration.

Vous pouvez facilement **[publier](/docs/development-lifecycle/release/release-rollback)** la dernière version enregistrée avec de nouvelles fonctionnalités, corrections et améliorations. ToolJet vous permet également de **[revenir en arrière](/docs/development-lifecycle/release/release-rollback#rollback)** vers une version enregistrée précédente si nécessaire. De plus, ToolJet vous permet de **[partager votre application](/docs/development-lifecycle/release/share-app)** de plusieurs manières.

### GitSync

Dans ToolJet, vous pouvez utiliser **[GitSync](/docs/development-lifecycle/gitsync/overview)** pour conserver un historique et une **[sauvegarde](/docs/development-lifecycle/backup/gitsync-backup)** de votre application. En vous intégrant à des dépôts Git, vous pouvez garantir que votre application reste sécurisée, organisée et facilement gérable au fil du temps.

### Gestion des environnements
ToolJet est fourni avec trois environnements prédéfinis : **développement, préproduction et production**. Ces environnements s'appliquent aux applications, sources de données et constantes, garantissant des tests contrôlés avant le déploiement. Pour plus de détails, consultez la [Documentation sur les environnements](/docs/development-lifecycle/environment/self-hosted/multi-environment)
    

### Environnements multi-instances
Vous pouvez déployer plusieurs instances ToolJet, chacune agissant comme un environnement différent. Cette configuration isole toutes les ressources ainsi que les utilisateurs entre les instances. Pour plus de détails, consultez la documentation sur les [Environnements multi-instances](/docs/development-lifecycle/environment/self-hosted/multi-instance/instance-as-environment).