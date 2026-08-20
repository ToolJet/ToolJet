---
id: overview
title: Vue d'ensemble
---

L'app-builder de ToolJet offre un environnement low-code natif de l'IA qui vous aide à créer et déployer rapidement des outils internes sans connaissances approfondies en programmation. Qu'il s'agisse de tableaux de bord, de workflows d'approbation, de systèmes de suivi ou d'applications de planification, vous pouvez créer des outils puissants en quelques minutes.

Les équipes d'ingénierie, de produit, d'opérations et métier peuvent créer des applications facilement, en suivant quatre étapes simples pour être opérationnelles en quelques minutes.

1. **Créer l'interface** – Concevez visuellement avec des composants en glisser-déposer.

2. **Connecter vos données** – Intégrez des bases de données, des API et des services tiers.

3. **Rendre l'application interactive** – Ajoutez des actions, des événements et de la logique pour donner vie à votre application.

4. **Gérer la logique complexe** – Utilisez JavaScript partout pour des workflows avancés.

Dans ce guide, vous découvrirez chaque étape et verrez comment elles s'articulent pour donner vie à votre application.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/banner.png" alt="Components Preview" /> </div>


## 1.  Créer l'interface

Commencez à concevoir l'interface de votre application avec plus de 60 composants prédéfinis, des **tableaux** et **formulaires** aux **graphiques** et **boutons**. Il suffit de glisser-déposer les composants sur le canvas, de les redimensionner, de les repositionner et de les ajuster finement via le panneau des propriétés.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/components.png" alt="Components Preview" /> </div>

Chaque composant dispose d'options de style intégrées. Vous pouvez personnaliser le texte, les couleurs, la visibilité et bien plus via le panneau de style. Ces composants sont dynamiques, ce qui vous permet de gérer l'état (state) et les événements comme vous le feriez avec votre framework frontend préféré.

## 2. Connecter vos données

Vous pouvez connecter votre application à plusieurs [sources de données](/docs/data-sources/overview), incluant des bases SQL, NoSQL, des bases de données vectorielles, des API, des feuilles de calcul et des services cloud. Une fois connectées, vous pouvez récupérer, mettre à jour ou manipuler les données à l'aide de queries.

Une query est une action qui interagit avec votre source de données, qu'il s'agisse de récupérer des enregistrements, de filtrer des résultats ou d'écrire des données. Elle agit comme le pont entre votre interface utilisateur et vos données.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/queries.png" alt="Queries Preview" /> </div>


Utilisez le **panneau des queries** pour créer des queries, soit via une interface basée sur des formulaires, soit en écrivant directement du code/SQL. Vous pouvez les utiliser pour récupérer des données à afficher dans les composants ou pour renvoyer les saisies des utilisateurs vers votre base de données. Elles peuvent être exécutées manuellement ou déclenchées par des événements comme le chargement de la page, les actions des utilisateurs sur les composants, ou le succès ou l'échec d'autres queries.

## 3. Rendre les applications interactives

Rendez vos applications interactives en ajoutant des événements aux composants, aux queries et aux pages. Les événements définissent comment votre application réagit aux actions des utilisateurs ou à des conditions spécifiques, apportant de l'interactivité à votre application. ToolJet propose un système d'événements déclaratif, similaire aux gestionnaires d'événements JavaScript, vous permettant de contrôler le comportement de l'application sans écrire de code répétitif.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/events.png" alt="Events Preview" /> </div>

Les événements peuvent être déclenchés par diverses actions telles qu'un clic sur un bouton, la soumission d'un formulaire, le chargement d'une page ou la fin d'exécution d'une query. Une fois déclenchés, vous pouvez exécuter des actions comme lancer une query, ouvrir un modal, afficher une notification ou naviguer vers une autre page.

Vous pouvez également enchaîner plusieurs événements et actions ensemble, permettant des workflows complexes en plusieurs étapes sans écrire de code répétitif.

## 4. Gérer la logique personnalisée

ToolJet facilite la création d'applications sans code, mais lorsque vous avez besoin de plus de contrôle, il offre la possibilité d'ajouter du code personnalisé pour écrire votre propre logique. Vous pouvez créer des queries JavaScript ou Python dans l'app-builder pour effectuer des calculs, transformer des données, déclencher d'autres queries ou mettre à jour des composants d'interface. Ces extraits de code ont un accès complet aux propriétés du composant, aux résultats des autres queries et à l'état complet de l'application, vous permettant d'écrire une logique personnalisée pour n'importe quel cas d'usage comme un comportement conditionnel, un traitement de données ou des mises à jour dynamiques de l'interface.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/custom-code.png" alt="Custom Code Preview" /> </div>

Cela permet aux développeurs de gérer des scénarios complexes avec du code, tout en tirant parti de l'environnement low-code de ToolJet.

## Cas d'usage
Avec ToolJet, vous pouvez créer un large éventail d'outils internes, notamment (mais sans s'y limiter) :

* Système de gestion des stocks
* Suivi des bons de commande
* Portail d'intégration client
* Outil d'origination et de souscription de prêts
* Tableau de bord de détection de fraude
* Workflow d'approbation des notes de frais
* Suivi des feuilles de temps
* Application d'intégration des employés
* Système de ticketing interne
* Tableau de bord de reporting de conformité
* Suivi du pipeline commercial
* Portail de gestion des actifs numériques

Des tableaux de bord simples aux outils complexes basés sur les données, l'app-builder de ToolJet vous aide à créer des applications avec rapidité et précision.