---
id: event-triggers
title: Configurer les événements
---

Les événements définissent comment votre application doit réagir lorsqu'un utilisateur interagit avec un composant ou lorsqu'une condition système spécifique est remplie. Qu'il s'agisse de cliquer sur un composant **Button**, de sélectionner un élément dans un **Dropdown**, ou de terminer une query, les événements vous permettent d'intégrer une logique qui rend votre application interactive et réactive.

Vous pouvez utiliser les déclencheurs d'événements pour exécuter des queries, mettre à jour des variables, afficher des alertes, naviguer vers différentes pages, et plus encore. Chaque événement peut être configuré pour déclencher une ou plusieurs actions en séquence, ce qui vous permet de construire facilement des flux logiques complexes. Consultez le [guide du composant](/docs/app-builder/building-ui/component-library) correspondant pour voir la liste complète des événements pris en charge, et consultez la [référence des actions](/docs/actions/overview) pour toutes les actions disponibles.

## Configurer un event handler

Supposons que vous créez un formulaire de feedback à l'aide d'un composant **Form** qui soumet les saisies de l'utilisateur à une base de données chaque fois que l'utilisateur clique sur le bouton submit. Pour y parvenir, vous pouvez configurer le bouton submit pour déclencher une query lors du clic.

Tout d'abord, créez une query et nommez-la _addData_. Cette query insère les valeurs du **Form** dans la base de données. Ensuite, configurez le **Button** avec l'event handler suivant :

- Event : **On Click**
- Action : **Run Query**
- Query : **addData**

<img className="screenshot-full img-l" src="/img/app-builder/events/event-handler/form.png" alt="Events Architecture Diagram"/>

Cette configuration garantit qu'à chaque clic sur le bouton, les données du **Form** sont envoyées à votre base de données.

<img className="screenshot-full img-full" src="/img/app-builder/events/event-handler/dig.png" alt="Events Architecture Diagram"/>

## Configurer un event handler séquentiel

Poursuivons avec l'exemple précédent. Après la soumission du formulaire, vous pourriez vouloir mettre à jour l'interface en récupérant les dernières données. Pour cela, créez une nouvelle query et nommez-la _fetchData_, qui récupère les enregistrements mis à jour depuis la base de données.

Ensuite, configurez un event handler qui s'exécute de façon séquentielle après le succès de la query _addData_ :

- Event : **Query Success**
- Action : **Run Query**
- Query : **fetchData**

<img className="screenshot-full img-full" src="/img/app-builder/events/event-handler/query.png" alt="Events Architecture Diagram"/>

Cette configuration garantit que la query _fetchData_ est déclenchée automatiquement lorsque la query _addData_ se termine avec succès.

<img className="screenshot-full img-full" src="/img/app-builder/events/event-handler/query-dig.png" alt="Events Architecture Diagram"/>

Qu'il s'agisse de soumettre un formulaire, d'exécuter une query, ou de mettre à jour votre interface, les événements et les actions vous permettent de définir un comportement dynamique piloté par la logique, sans écrire de code backend.

## Gérer les event handlers

Chaque event handler dispose de deux contrôles supplémentaires accessibles en le développant dans le panneau Events.

**Enable event** : Un interrupteur qui active ou désactive le handler sans le supprimer. Lorsqu'il est désactivé, le handler est ignoré à l'exécution — utile pour tester ou déboguer sans perdre la configuration du handler.

**Event name** : Un champ de texte libre permettant d'attribuer un libellé personnalisé au handler. Utilisez-le pour distinguer plusieurs handlers sur le même événement — par exemple, en nommant l'un `"log to console"` et l'autre `"trigger refresh"` lorsque les deux se déclenchent sur **On click**.

<img className="screenshot-full img-l" src="/img/app-builder/events/event-handler/manage.png" alt="Event handler enable toggle and name field"/>
