---
title: Utiliser fx pour un comportement dynamique
id: fx-dynamic-behaviour
---

Dans ToolJet, vous pouvez rendre vos applications plus interactives en écrivant de la logique directement dans les propriétés des composants à l'aide de l'éditeur **fx**. Par exemple, vous pourriez vouloir désactiver un **Button** jusqu'à ce que tous les champs de formulaire requis soient remplis, ou changer la couleur d'un champ de saisie selon que la valeur saisie est valide ou non. Vous pouvez définir cette logique conditionnelle à l'aide d'expressions JavaScript dans l'éditeur **fx**.

Cela facilite la création d'interfaces intuitives, avec des composants qui réagissent en temps réel aux actions de l'utilisateur et aux mises à jour de données.

## Comment fonctionne fx
Chaque fois que vous voyez l'icône **fx** à côté d'une propriété dans les paramètres d'un composant, cela signifie que vous pouvez passer en mode expression. En cliquant sur l'icône, une zone de saisie s'ouvre dans laquelle vous pouvez écrire une logique personnalisée en JavaScript à l'intérieur de `{{ }}`. Vous pouvez référencer directement les résultats de requêtes, les états de composants et les variables au niveau de l'application dans ces expressions. ToolJet prend en charge ici l'ensemble de la syntaxe JavaScript, y compris la logique conditionnelle, l'interpolation de chaînes, les méthodes de tableau comme map, filter et reduce, et bien plus encore.

Imaginons que vous créez un formulaire qui recueille la saisie de l'utilisateur. Vous souhaitez que le **bouton Submit** ne soit activé que si toutes les validations du formulaire réussissent.

Grâce au support **fx** de ToolJet, vous pouvez y parvenir dans la propriété Disabled du composant bouton, comme ceci :

<img className="screenshot-full img-m" src="/img/app-builder/custom-code/button-disable.png" alt=" button disable "/>

Cette expression désactive le **Button** lorsque le **Form** est invalide. Aucune bascule manuelle n'est nécessaire. De la même manière, vous pouvez utiliser la même approche pour mettre à jour d'autres propriétés telles que la visibilité, la couleur de fond, la taille de police, etc. pour différents composants. 

Si vous découvrez ToolJet et souhaitez apprendre à accéder aux propriétés des composants, consultez [ce guide](/docs/app-builder/building-ui/component-state#available-component-states).

## Cas d'usage

### États de chargement

Afficher des indicateurs de chargement jusqu'à ce que les données soient chargées.

Exemple : dans une application où vous chargez des données dans le composant Table, vous pourriez vouloir afficher un spinner de chargement pendant la récupération des données des employés.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/loading.png" alt=" button disable "/>

### Style conditionnel

Appliquer un style conditionnel (couleurs, polices, tailles) selon les valeurs issues des requêtes ou de l'état de l'application.

**Exemple :** dans un annuaire d'employés avec une liste d'utilisateurs, vous pouvez afficher des couleurs de fond différentes sur les cellules du **Table** selon que l'utilisateur est actif ou inactif.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/style.png" alt=" button disable "/>

### Validation de formulaire 

Activer ou désactiver les boutons de soumission selon la validité des champs du formulaire.

**Exemple :** dans les **Forms**, vous pouvez activer le bouton Submit uniquement lorsque tous les champs requis sont correctement remplis.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/form.png" alt=" button disable "/>

### Visibilité conditionnelle

Afficher ou masquer des composants selon des conditions spécifiques.

**Exemple :** dans une application d'annuaire d'employés, au sein du **Form** des informations personnelles, vous pouvez afficher de manière conditionnelle un **Text Input** permettant de saisir un nom de pays personnalisé lorsque l'utilisateur sélectionne « other » dans la liste déroulante des pays.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/conditional_visibility.png" alt=" button disable "/>

Grâce à l'éditeur **fx**, vous pouvez facilement ajouter un comportement dynamique à vos applications avec un minimum de code. 
