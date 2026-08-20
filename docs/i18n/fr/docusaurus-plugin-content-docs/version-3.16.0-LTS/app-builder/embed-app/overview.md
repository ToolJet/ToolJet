---
id: overview
title: Intégrer une application ToolJet
sidebar_label: Aperçu
---

<PlanBadge type="team" />

Intégrer (embed) une application ToolJet vous permet de proposer des tableaux de bord interactifs, des outils ou des workflows directement au sein d'autres sites web ou portails internes. Plutôt que de basculer entre plusieurs outils, les utilisateurs peuvent interagir avec votre application là où ils travaillent déjà, ce qui améliore l'efficacité et l'engagement.

Les applications ToolJet peuvent être intégrées dans divers scénarios :

- **Tableaux de bord destinés aux clients** – Afficher des analyses personnalisées directement au sein de votre plateforme.
- **Portails partenaires ou fournisseurs** – Offrir aux parties externes un accès sécurisé et limité à des applications spécifiques.
- **Widgets de productivité internes** – Intégrer des outils internes dans des pages intranet, des wikis ou des systèmes CRM.

En intégrant des applications, vous réduisez les changements de contexte, accélérez l'adoption par les utilisateurs et conservez les workflows critiques au sein de votre écosystème produit.

## Exemple

Par exemple, nous avons intégré une application **Documentation Feedback** directement dans ce document. Les utilisateurs peuvent soumettre un retour sans changer d'onglet, ce qui rend le processus plus rapide et plus efficace. En arrière-plan, vous pouvez créer une application admin séparée sur ToolJet pour analyser les résultats, ou configurer un [workflow ToolJet](/docs/workflows/overview/) pour effectuer des actions automatisées en fonction des retours reçus.

<iframe width="100%" height="650" src="https://app.tooljet.ai/applications/docs-embed-app-example" title="ToolJet app - docs-embed-app-example" frameborder="0" allowfullscreen></iframe>

<br/><br/>

En intégrant le formulaire de feedback ici, nous avons obtenu plusieurs avantages :

- **Soumissions plus rapides et plus simples** : Les utilisateurs peuvent donner leur avis instantanément, réduisant les frictions et améliorant les taux de réponse.
- **Collecte centralisée des données** : Toutes les réponses sont capturées en temps réel dans une base de données connectée à ToolJet, éliminant le besoin de suivi manuel.
- **Insights exploitables** : Les équipes peuvent créer une application admin ou un workflow séparé pour analyser les réponses, visualiser les tendances et agir immédiatement en fonction des retours des utilisateurs.
- **Engagement renforcé** : En conservant l'interaction au sein de la documentation, les utilisateurs se sentent davantage impliqués, et les retours importants ont moins de risques de passer inaperçus.

## Applications intégrées publiques vs privées

ToolJet vous permet d'intégrer des applications de manière publique ou privée, selon qui doit y avoir accès et le degré de sensibilité des données.

| Fonctionnalité      | Intégration publique                                          | Intégration privée                                                    |
| :----------------- | :----------------------------------------------------------- | :--------------------------------------------------------------------- |
| **Accès**           | Toute personne disposant du lien d'intégration ou de l'iframe peut la consulter | Restreint aux utilisateurs autorisés uniquement                        |
| **Authentification**| Non requise                                                   | Requise (l'application intégrée suit le SSO de l'application hôte)     |
| **Granularité**      | Non applicable                                                | Les jetons peuvent être limités à un utilisateur et une application spécifiques |
| **Cas d'utilisation**| Tableaux de bord marketing, formulaires ouverts, widgets destinés aux clients | Tableaux de bord internes, portails partenaires, applications de données sensibles |
| **Comment intégrer**| [Application publique](/docs/app-builder/embed-app/public-app) | [Application privée](/docs/app-builder/embed-app/private-app)          |
