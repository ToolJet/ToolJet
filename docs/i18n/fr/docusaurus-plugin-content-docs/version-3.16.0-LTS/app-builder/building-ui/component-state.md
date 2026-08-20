---
id: component-state
title: État des composants
---

Chaque composant ToolJet maintient un état (state) — un ensemble de valeurs représentant ses données et sa configuration actuelles. Cet état peut être consulté via des variables exposées, qui permettent aux composants d'interagir avec d'autres parties de l'application. Par exemple, la valeur saisie dans un composant de saisie de texte peut être transmise à une query pour récupérer des données depuis la base de données.

Chaque composant dispose d'un ensemble unique de variables exposées en fonction de sa fonctionnalité — par exemple, un composant **Table** expose `selectedRow`, une checkbox expose `isChecked`, et ainsi de suite. 

Les états des composants dans ToolJet sont dynamiques et peuvent être modifiés à l'exécution à l'aide de fonctions intégrées appelées [Component-Specific Actions (CSA)](/docs/app-builder/events/use-case/csa), telles que `reset()`, `setValue()` et `setVisibility()`. Ces actions vous permettent de déclencher une logique en réponse aux interactions des utilisateurs. 

Les états des composants peuvent être utilisés dans toute l'application pour créer des expériences interactives et réactives :
- Dans les queries — pour envoyer les saisies utilisateur ou les valeurs de composants en tant que paramètres.
- Dans d'autres composants — pour afficher, mettre à jour ou interagir conditionnellement avec des composants.

## États de composants disponibles {#available-component-states}

Dans l'App-Builder, vous pouvez visualiser tous les états de composants disponibles à l'aide de l'Inspector situé dans la barre latérale gauche. Pour plus de détails, consultez le guide [Inspector](/docs/app-builder/debugging/inspector).

<img style={{ marginBottom:'15px' }} className="screenshot-full img-s" src="/img/app-builder/access-comp-data/inspector.png" alt="App Builder: Properties Panel"/>

- Ouvrez la liste déroulante Components à l'intérieur de l'Inspector.
- Sélectionnez le composant dont vous souhaitez inspecter l'état.
- Une liste déroulante secondaire apparaîtra, affichant tous les états disponibles.

Vous pouvez également copier la valeur de l'état ou son chemin, qui peut être utilisé pour y accéder depuis un autre composant ou une autre query. Lorsque vous survolez un état dans l'Inspector, deux icônes apparaissent — l'une pour copier le chemin et l'autre pour copier la valeur.

<img className="screenshot-full img-s" style={{ marginBottom:'15px' }} src="/img/app-builder/access-comp-data/comp-inspect.png" alt="App Builder: Properties Panel"/>

## Accéder à l'état d'un composant

Vous pouvez accéder à l'état d'un composant en utilisant la syntaxe suivante : <br/>
`{{components.<component-name>.<variable-name>}}`

Exemple : `{{components.numberinput1.value}}` - Cela récupérera la valeur saisie par l'utilisateur dans le composant **numberinput1**.

