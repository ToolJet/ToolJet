---
id: run-query-at-specified-intervals
title: Exécuter une query à intervalles réguliers
---

Ce guide explique comment configurer des queries pour qu'elles s'exécutent à intervalles de temps fixes dans ToolJet en utilisant des queries Run JavaScript (RunJS). En exploitant les fonctions de temporisation JavaScript, les queries peuvent être exécutées périodiquement pour automatiser la récupération de données ou déclencher des opérations en arrière-plan à des intervalles définis. Cette approche permet des mises à jour de données cohérentes et contrôlées, sans nécessiter d'interaction manuelle de l'utilisateur.

## Créer une nouvelle application

Commencez par créer une nouvelle application dans le dashboard ToolJet. Une fois l'app-builder ouvert, glissez un composant table sur le canvas. Ce composant affichera les données récupérées par la query REST API.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/how-to/setinterval/app-1.png" alt="Table Component With Data" />

## Configurer une query REST API

Depuis le panneau des queries, créez une nouvelle query REST API. Utilisez des données REST API fictives en choisissant la méthode « GET » et en indiquant l'endpoint (par exemple, `https://jsonplaceholder.typicode.com/posts`). Nommez la query « post » et exécutez-la (`Run`) pour vous assurer que les données sont récupérées avec succès.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/how-to/setinterval/query-1.png" alt="ret api query with url" />

## Configurer les propriétés du tableau

Dans les propriétés du Table, liez les données de la query au tableau en définissant la propriété « table data » sur `{{queries.post.data}}`. Cela établit la connexion entre la query REST API et le composant table.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/how-to/setinterval/query-binding.png" alt="Table component with query binding" />

## Implémenter la query RunJS

Créez une query RunJS pour mettre en place des intervalles déclenchant la query REST API. Utilisez le script suivant :

```js
actions.setVariable('interval', setInterval(countdown, 5000)); // 5000ms = 5 seconds

function countdown(){  // Function to trigger the REST API query
    queries.post.run(); // action to run the REST API query
}
```

Ajustez la durée de l'intervalle selon vos besoins. Vous pouvez éventuellement utiliser `async` et `await` pour plusieurs actions au sein de la fonction countdown.

```js
actions.setVariable('interval',setInterval(countdown, 5000));
async function countdown(){
  await queries.restapi1.run()
  await queries.restapi2.run()
  await actions.showAlert('info','This is an information')
}
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/setinterval/query-2.png" alt="query set interval" />

## Configuration avancée


Depuis la section Settings de la query RunJS, activez **Run query on page load**. Cela garantit que la query est déclenchée au chargement de l'application. Renommez la query en « setInterval » pour terminer la configuration.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/setinterval/settings-pageload.png" alt="settings" />

## Empêcher un déclenchement indéfini

Créez une autre query RunJS nommée « clearInrternal » pour arrêter le déclenchement indéfini de la query. Utilisez la méthode `clearInterval()` pour effacer l'intervalle. Cette méthode récupère la valeur de la variable définie dans la query « setInterval ».

```js
clearInterval(variables.interval);
```

## Ajouter un bouton

Glissez un bouton sur le canvas pour servir de mécanisme d'arrêt déclenché par l'utilisateur. Attachez un gestionnaire d'événement pour exécuter la query « clear » lorsque le bouton est cliqué.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/setinterval/button-query.png" alt="Button component" />

En suivant ces étapes, votre application ToolJet récupérera dynamiquement des données à intervalles réguliers, offrant une expérience utilisateur efficace et automatisée.


## Considérations de performance

- Évitez les intervalles très courts (par exemple, < 1s)
- Soyez prudent lors du déclenchement de queries fortement dépendantes d'API
- Privilégiez les déclencheurs manuels pour les opérations coûteuses