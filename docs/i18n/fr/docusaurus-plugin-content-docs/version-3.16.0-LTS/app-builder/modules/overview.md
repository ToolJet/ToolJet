---
id: overview
title: Modules
sidebar_label: Vue d'ensemble
---

<PlanBadge type="team" />

Les **Modules** dans ToolJet sont des interfaces utilisateur réutilisables qui regroupent des composants, des queries, des actions et de la logique. Considérez-les comme des mini-applications que vous pouvez intégrer dans plusieurs applications au sein du même workspace. Ils aident à éliminer la duplication, à garantir la cohérence et à accélérer le développement, en particulier pour les modèles répétitifs comme les en-têtes, les formulaires, les tableaux de bord ou les vues de tableau.

Une fois créés, les modules peuvent être réutilisés dans tout votre workspace. Toute mise à jour que vous apportez à un module se répercute automatiquement dans chaque application où il est utilisé. Cela garantit une source unique de vérité et réduit considérablement les efforts de maintenance.

## Quand utiliser les modules

Utilisez les modules lorsque :

- Vous avez besoin d'un élément d'interface partagé, comme un profil client ou une barre de navigation, dans plusieurs applications au sein du même workspace.
- Vous créez des flux répétitifs tels que des formulaires d'approbation, des filtres de données ou des panneaux de saisie.
- Vous souhaitez simplifier une logique complexe afin que d'autres puissent l'utiliser avec une configuration minimale.

Au lieu de copier-coller des composants ou de la logique entre les applications, les modules vous offrent un moyen centralisé et réutilisable de créer des fonctionnalités, entièrement configurable via des entrées et des sorties pour s'adapter à tout contexte.

<img className="screenshot-full img-full" src="/img/app-builder/modules/module-builder.png" alt="Module Builder" />

Pour commencer avec les modules, consultez le guide [Créer un module](/docs/app-builder/modules/create-module). Une fois votre module créé, vous pouvez l'utiliser dans n'importe quelle application de votre workspace.
