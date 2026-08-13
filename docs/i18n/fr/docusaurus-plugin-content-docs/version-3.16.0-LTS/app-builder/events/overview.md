---
id: overview
title: Vue d'ensemble des événements et des actions
sidebar_label: Vue d'ensemble
---

Dans ToolJet, vous pouvez créer des applications dynamiques et pilotées par la logique en utilisant les Événements, les Actions, les Variables et les Actions Spécifiques aux Composants (CSA). Ces fonctionnalités vous permettent de définir comment votre application répond aux interactions utilisateur et aux événements système sans écrire de code backend. Chaque composant possède un ensemble unique d'événements et de CSA disponibles selon sa fonctionnalité. Reportez-vous aux guides des [composants individuels](/docs/app-builder/building-ui/component-library) pour plus de détails.

## Événements

Les événements sont des déclencheurs qui répondent lorsque certaines conditions sont remplies — soit par une interaction utilisateur (par exemple, cliquer sur un composant **Button** ou sélectionner une option **Dropdown**), soit par des changements au niveau du système (par exemple, l'achèvement d'une query). Vous pouvez configurer les événements à l'aide de gestionnaires d'événements sur les composants ou les queries. Chaque gestionnaire définit le déclencheur et les actions qui doivent suivre.

Par exemple, lorsqu'un utilisateur clique sur un **Button**, cela peut déclencher une query pour actualiser les données. Une fois cette query terminée, un second événement peut s'exécuter pour afficher une alerte de confirmation.

<img className="screenshot-full img-l" src="/img/app-builder/events/overview/events.png" alt="Events Architecture Diagram"/>

## Actions

Les actions spécifient le résultat lorsqu'un événement est déclenché. ToolJet prend en charge un large éventail d'actions telles que l'exécution de queries, l'affichage d'alertes, la navigation entre les pages, la copie de texte dans le presse-papiers, et plus encore. Vous pouvez configurer les actions directement dans les gestionnaires d'événements ou [dynamiquement à l'aide de JavaScript](/docs/app-builder/custom-code/control-components) via des queries RunJS. Pour une liste complète des actions disponibles, reportez-vous au guide de [référence des actions](/docs/actions/run-query).

<img className="screenshot-full img-l" src="/img/app-builder/events/overview/actions.png" alt="Events Architecture Diagram"/>

## Actions Spécifiques aux Composants (CSA)

Les Actions Spécifiques aux Composants (CSA) sont des fonctions intégrées qui vous permettent de contrôler l'état et le comportement d'un composant à l'exécution. Chaque composant possède son propre ensemble de CSA selon ses capacités. Par exemple, un composant **Text** prend en charge l'action `setText()`, tandis qu'un composant **Radio Button** propose `selectOption()`.

<img className="screenshot-full img-l" src="/img/app-builder/events/overview/csa.png" alt="Events Architecture Diagram"/>

## Variables

Les variables vous permettent de stocker et de gérer des données à travers toute votre application ou au sein de pages spécifiques. Elles sont essentielles pour maintenir l'état, contrôler la logique et créer des expériences utilisateur personnalisées.
ToolJet prend en charge les types de variables suivants :

- Variables au niveau de l'application – accessibles dans toute l'application.
- Variables au niveau de la page – limitées à une page spécifique.

<img className="screenshot-full img-s" src="/img/app-builder/events/overview/var.png" alt="Events Architecture Diagram"/>

<br/><br/>

De plus, ToolJet fournit des [variables exposées](/docs/app-builder/building-ui/component-state) intégrées pour les composants et les queries, qui représentent leur état d'exécution actuel.
