---
id: run-js
title: Run JavaScript Code
slug: /data-sources/run-js
---

La fonctionnalité **Run JavaScript Code** de ToolJet permet d'exécuter du code JavaScript personnalisé pour améliorer l'interactivité de l'application. Cette fonctionnalité est utile pour effectuer des calculs, générer des valeurs ou interagir avec des requêtes et des composants.

## Créer une requête Run JavaScript

1. Cliquez sur le bouton **+ Add** du gestionnaire de requêtes dans le panneau inférieur de l'éditeur.
2. Sélectionnez **Run JavaScript Code** dans la liste des sources de données disponibles.
3. Ajoutez le code JavaScript.
4. Cliquez sur le bouton **Preview** pour prévisualiser le résultat ou cliquez sur le bouton **Run** pour déclencher la requête.

<img className="screenshot-full img-full" src="/img/datasource-reference/custom-javascript/runjs-connection-v3.png" alt="Run JavaScript code" />

## Paramètres dans Run JavaScript Code {#parameters-in-run-javascript-code}

Les paramètres permettent un contrôle dynamique sur l'exécution du code JavaScript sans modifier le script principal. Cela offre une flexibilité permettant au même code de s'exécuter avec des entrées différentes.

Chaque paramètre nécessite :

- **Name** : Nom du paramètre
- **Default value** : La valeur peut être des chaînes constantes, des nombres et des objets.

### Étapes pour ajouter un paramètre

1. Dans l'éditeur de requête RunJS, cliquez sur le bouton **Parameters +** pour créer un nouveau paramètre.
2. Fournissez un **Name** pour le paramètre.
3. Définissez une **Value** par défaut, qui peut être une chaîne, un nombre ou un objet.

Une fois ajouté, le **paramètre peut être référencé dans le code en utilisant la syntaxe** : `parameters.<name>`.

<img className="screenshot-full img-full" src="/img/datasource-reference/custom-javascript/runjs-param.png" alt="Run JavaScript code"/>

### Afficher la valeur d'un paramètre dans une boîte d'alerte

Créons un nouveau paramètre nommé _newAlert_ et définissons la valeur comme l'objet `Displaying the Parameter Value in an Alert Box`, puis utilisons la méthode JS alert pour afficher la valeur dans une fenêtre pop-up.

Syntaxe :

```
alert(parameters.newAlert)
```

Lorsque la requête est déclenchée, l'alerte affichera la valeur du paramètre.

<img className="screenshot-full img-full" src="/img/datasource-reference/custom-javascript/runjs-param1.png" alt="Run JavaScript code"  />

### Appeler une autre requête avec des paramètres

Les paramètres peuvent également être utilisés pour déclencher d'autres requêtes et transmettre des valeurs personnalisées. Voici un exemple de la façon d'appeler une requête depuis une autre en fournissant des paramètres personnalisés.

1. Commencez par créer une nouvelle requête RunJS nommée _multiply_.
   - Dans cette requête, ajoutez les paramètres suivants :
     - _num1_ avec une valeur par défaut de **10**
     - _num2_ avec une valeur par défaut de **2**.

   - Ajoutez le code JavaScript suivant :

   ```javascript
   return parameters.num1 * parameters.num2;
   ```

   - Pour afficher le résultat, placez un composant text sur le canevas et définissez son texte sur `{{queries.multiply.data}}`.
     <br/>
     <img className="screenshot-full img-full" src="/img/datasource-reference/custom-javascript/multiply-v3.png" alt="Run JavaScript code" />

2. Créons maintenant une autre requête RunJS appelée _callMultiply_, où nous invoquerons la requête _multiply_ créée précédemment en utilisant des valeurs de paramètres personnalisées. Voici l'extrait de code pour _callMultiply_ :

   ```js
   queries.multiply.run({ num1: 20, num2: 7 });
   ```

   En exécutant ce code dans _callMultiply_, nous déclenchons la requête _multiply_ avec des valeurs spécifiques pour ses paramètres.

   <img className="screenshot-full img-full" src="/img/datasource-reference/custom-javascript/callmultiply-v3.png" alt="Run JavaScript code" />

Avec cette configuration, la requête _multiply_ peut être appelée depuis d'autres requêtes, comme _callMultiply_, en fournissant des valeurs de paramètres personnalisées. Cela vous permet de réutiliser la requête _multiply_ avec des entrées différentes et d'afficher les résultats en conséquence.

### Fonctions de rappel (Callback) {#callback-functions}

Dans ToolJet, lors du déclenchement d'une requête à l'aide de `queries.<queryName>.run()`, vous pouvez transmettre des **gestionnaires de rappel** pour gérer de manière programmatique les états d'exécution de la requête et effectuer des actions personnalisées lorsque la requête réussit ou échoue.


#### Paramètres

| Paramètre  | Type   | Requis | Description |
|------------|--------|----------|-------------|
| Query Parameters | Object | Non | Paires clé-valeur transmises comme premier argument de la requête (par exemple, `{ limit: 10 }`). |
| Callbacks  | Object | Non | Second argument contenant les gestionnaires `onSuccess` et `onFailure`. |

 :::note
- Lors de la transmission de l'objet `Callbacks`, l'argument `Query Parameters` doit être fourni.  
- Si aucun paramètre n'est requis, transmettez un objet vide `{}` comme valeur de substitution.
:::

```javascript
queries.getUsers.run(
  { limit: 10 },
  {
    onSuccess: (data) => {
      actions.showAlert('success', 'Users fetched successfully');
    },
    onFailure: (error) => {
      actions.showAlert('warning', error.message || 'Something went wrong');
    }
  }
);
```

## Exemples de requêtes RunJS {#runjs-example-queries}

### Générer un nombre aléatoire

Cet exemple montre comment générer et afficher un nombre aléatoire à l'aide de JavaScript.

1. Faites glisser un widget **button** et un widget **text** à l'intérieur d'un widget **container**.
2. Cliquez sur **+ Add** dans le panneau de requêtes pour créer une requête et sélectionnez **Run JavaScript code** parmi les sources de données disponibles.
3. Écrivez le code dans l'**éditeur JavaScript** et exécutez la requête.

```js
const a = Math.floor(Math.random() * (10 - 1)) + 1;
return a;
```

4. Modifiez les propriétés des widgets :
   1. Ajoutez un gestionnaire d'événements au bouton :
      1. Sélectionnez l'événement **On Click**
      2. L'action **Run Query**
      3. Sélectionnez la requête _runjs1_ que nous avons créée. Cela exécutera le code JavaScript chaque fois que le bouton est cliqué.
   2. Modifiez la propriété du widget text :
      1. Dans le champ text, saisissez **Random number:** `{{queries.runjs1.data}}`. Cela affichera le résultat sous la forme Random number: _résultat du code JS_

<img className="screenshot-full img-full" src="/img/datasource-reference/custom-javascript/runjs-ex-query.png" alt="Run JavaScript code"  />

### Générer un identifiant unique

Le code suivant génère un identifiant unique au format « id » suivi d'une séquence de caractères hexadécimaux aléatoires.

```js
var id = "id" + Math.random().toString(16).slice(2);
return id;
```

Par exemple, cela pourrait ressembler à « id2f4a1b ».

<img className="screenshot-full img-full" src="/img/datasource-reference/custom-javascript/runjs-unique-id.png" alt="Run JavaScript code"  />

### Générer un identifiant unique basé sur un horodatage

Dans ce code, l'ID résultant aura le format « timestamp + randomHex », où « timestamp » est l'heure actuelle en base 32 et « randomHex » est une valeur hexadécimale aléatoire.

```js
return String(Date.now().toString(32) + Math.random().toString(16)).replace(
  /\./g,
  "",
);
```

Cet ID sera plus long que celui généré précédemment, et pourrait ressembler à « 2g3h1d6a4h3 ».

<img className="screenshot-full img-full" src="/img/datasource-reference/custom-javascript/runjs-ts.png" alt="Run JavaScript code"  />

:::tip Resources

- Vous pouvez également écrire du code JavaScript personnalisé pour récupérer des données depuis des **API externes** et manipuler la réponse pour une représentation graphique. Voici le [tutoriel](https://blog.tooljet.com/build-github-stars-history-app-in-5-minutes-using-low-code/) expliquant comment nous avons utilisé du code JavaScript personnalisé pour créer une application utilisant l'API GitHub.
- [Importer des bibliothèques externes](/docs/data-sources/runjs/use-axios-in-runjs) avec RunJS.
- [Faire échouer intentionnellement](/docs/data-sources/runjs/intentionally-fail-js-query) une requête RunJS.
- [Déclencher une requête à des intervalles spécifiés](/docs/app-builder/connecting-with-data-sources/run-query-at-specified-intervals) avec RunJS.
  :::

## Bibliothèques

ToolJet vous permet d'utiliser en interne les bibliothèques suivantes :

| Nom   | Documentation                                                          |
| ------ | ---------------------------------------------------------------------- |
| Moment | [https://momentjs.com/docs/](https://momentjs.com/docs/)               |
| Lodash | [https://lodash.com/docs/](https://lodash.com/docs/)                   |
| Axios  | [https://axios-http.com/docs/intro](https://axios-http.com/docs/intro) |

:::info
Des problèmes lors de l'écriture de code JavaScript personnalisé ? Posez votre question dans notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA).
:::
