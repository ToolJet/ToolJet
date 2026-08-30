---
id: csa
title: Contrôler l'état d'un composant
---

Les Actions Spécifiques aux Composants (CSA) sont des fonctions intégrées qui vous permettent de contrôler l'état et le comportement du composant dans l'application. Chaque composant possède son propre ensemble de CSA selon ses capacités.

Par exemple, un composant Text prend en charge l'action `setText()`, tandis qu'un composant Radio Button propose `selectOption()`.

Vous pouvez déclencher ces actions via des gestionnaires d'événements ou en utilisant des expressions dans vos queries. Reportez-vous au [guide du composant](/docs/app-builder/building-ui/component-library) correspondant pour une liste complète des CSA prises en charge.

## Contrôler les composants

Supposons que vous ayez utilisé un composant **Form** pour créer un formulaire de feedback et que vous souhaitiez effacer toutes les entrées une fois les données soumises à la base de données. ToolJet fournit une fonction `resetForm` pour vous y aider, qui peut être déclenchée de deux manières :
- [En utilisant un gestionnaire d'événements](#using-an-event-handler)
- [En utilisant une expression JS dans une query](#using-a-javascript-expression-in-a-query)

### En utilisant un gestionnaire d'événements {#using-an-event-handler}

Supposons que vous ayez une query nommée **addData**, utilisée pour insérer les données du formulaire dans la base de données. Pour effacer le **Form** à l'aide d'un gestionnaire d'événements, ajoutez la configuration suivante à votre query **addData** :
- Événement : **Query Success**
- Action : **Control Component**
- Composant : **feedbackForm** (Sélectionnez votre composant **Form** dans le menu déroulant)
- Actions : **Reset Form**

<img className="screenshot-full img-full" src="/img/app-builder/events/csa/resetForm.png" alt="Events Architecture Diagram"/> <br/><br/>

Cette configuration garantit que le composant **Form** est effacé automatiquement lorsque la query **addData** se termine avec succès.

<img className="screenshot-full img-full" src="/img/app-builder/events/csa/csa-dig.png" alt="Events Architecture Diagram"/>

### En utilisant une expression JavaScript dans une query {#using-a-javascript-expression-in-a-query}

Alternativement, vous pouvez réinitialiser le **Form** directement dans votre query en ajoutant cette expression JavaScript :

```js
await components.feedbackForm.resetForm()
```

Les Actions Spécifiques aux Composants vous donnent un contrôle précis sur le comportement des composants à l'exécution, rendant vos applications plus interactives et réactives.
