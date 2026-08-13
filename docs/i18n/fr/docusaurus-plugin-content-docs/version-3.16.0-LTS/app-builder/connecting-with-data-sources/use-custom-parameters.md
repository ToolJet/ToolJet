---
id: use-custom-parameters
title: Utiliser les paramètres de requête
---

Les paramètres personnalisés de vos requêtes offrent un moyen flexible d'introduire des variables sans modifier directement les paramètres de la requête. Ce guide vous accompagnera dans la création, l'utilisation et l'appel de requêtes avec des paramètres personnalisés.

## Ajouter des paramètres personnalisés

1. Ouvrez le panneau de requête et sélectionnez la requête à laquelle vous souhaitez ajouter des paramètres personnalisés.
2. Accédez à la section **Parameters** dans la barre supérieure.
3. Cliquez sur le bouton **+** pour ajouter un paramètre personnalisé.
4. Pour chaque paramètre, précisez :
    - **Name :** identifiant du paramètre.
    - **Default value :** une chaîne, un nombre ou un objet constant.

<img className="screenshot-full img-full" src="/img/how-to/custom-parameters/param-1.png" alt="How to: use custom parameters" />

## Syntaxe pour utiliser les paramètres

Utilisez `parameters.<identifier>` dans votre requête pour employer des paramètres personnalisés. Notez que les paramètres ne peuvent être utilisés qu'au sein de la requête où ils sont définis.

<img  className="screenshot-full img-full" src="/img/how-to/custom-parameters/param-2.png" alt="How to: use custom parameters" />

## Exemple : créer une ligne dans ToolJetDB avec des paramètres personnalisés

Supposons que nous ayons une table ToolJetDB avec les colonnes suivantes : `name`, `email` et `contact`. Nous allons créer une nouvelle ligne dans la table en utilisant des paramètres personnalisés.

- Créez une nouvelle requête ToolJetDB, sélectionnez une table dans la liste déroulante et sélectionnez l'opération `Create Row`.

- Ajoutez les paramètres suivants :
  1. **name :** `name` et **value :** `Shubh`
  2. **name :** `email` et **value :** `shubh@email.com`
  3. **name :** `contact` et **value :** `1234567890`

- Ajoutez les colonnes à la requête et utilisez les paramètres personnalisés pour définir les valeurs.

  | Colonne | Valeur |
  | ------ | ----- |
  | name   | `{{parameters.name}}` |
  | email  | `{{parameters.email}}` |
  | contact| `{{parameters.contact}}` |

  <img className="screenshot-full img-full" src="/img/how-to/custom-parameters/param-3.png" alt="How to: use custom parameters" />

- Enfin, exécutez la requête pour créer une nouvelle ligne dans la table ToolJetDB avec les valeurs fournies dans les paramètres personnalisés.

## Exemple : fournir des paramètres personnalisés via des événements

Dans cet exemple, nous allons montrer comment utiliser des paramètres personnalisés dans une requête en fournissant des valeurs provenant d'un événement. Nous allons exécuter une requête REST API et, en cas de succès, exécuter la requête ToolJetDB pour créer une nouvelle ligne avec les données de la réponse.

1. **Créer une requête REST API :**
   - Méthode : `GET`
   - URL : `https://reqres.in/api/users?page=2`

2. **Ajouter un événement de succès :**
   - Nom : `onSuccess`
   - Action : `Run Query`
   - Requête : `update-customers`
   - Paramètres : les paramètres que vous avez ajoutés à la requête seront automatiquement disponibles dans l'événement.
      1. **name :** `{{queries.get-user-data.data.data[0].name}}` Cela utilisera le nom du premier enregistrement des données de la réponse.
      2. **email :** `{{queries.get-user-data.data.data[0].email}}` Cela utilisera l'email du premier enregistrement des données de la réponse.
      3. **contact :** `1234567890` fourni comme valeur constante, uniquement à titre de démonstration.

3. **Exécutez la requête REST API et observez la nouvelle ligne créée dans la table ToolJetDB.**

**Remarque :** vous pouvez également utiliser des paramètres dans les requêtes JavaScript. Pour en savoir plus, consultez [JS Query Parameter](/docs/data-sources/run-js/#parameters-in-run-javascript-code). 

<img className="screenshot-full img-full" src="/img/how-to/custom-parameters/param-4.png" alt="How to: use custom parameters" />

## Exécuter des requêtes avec des callbacks

Lorsque vous exécutez une requête de manière programmatique avec `queries.<queryName>.run()`, vous pouvez passer un second argument optionnel contenant les callbacks `onSuccess` et `onFailure` pour traiter le résultat directement en ligne, sans avoir à configurer des gestionnaires d'événements séparés.

**Syntaxe :**

```js
queries.<queryName>.run(
  { param1: value1, param2: value2 },  // parameters (first argument)
  {                                     // options (second argument, optional)
    onSuccess: (data) => {
      // runs when the query completes successfully
      // 'data' contains the query result
    },
    onFailure: (error) => {
      // runs when the query fails
      // 'error' contains error information
    }
  }
)
```

`onSuccess` et `onFailure` sont tous deux optionnels — n'incluez que ceux dont vous avez besoin.

**Exemple :**

```js
queries.submitOrder.run(
  { orderId: components.orderTable.selectedRow.id },
  {
    onSuccess: (data) => {
      actions.showAlert('success', `Order ${data.orderId} submitted`);
      queries.refreshOrders.run();
    },
    onFailure: (error) => {
      actions.showAlert('error', 'Submission failed — please try again');
    }
  }
);
```

Si aucun paramètre n'est nécessaire, passez un objet vide ou omettez entièrement le premier argument et ne passez que les options :

```js
queries.fetchReport.run({}, {
  onSuccess: (data) => components.reportViewer.setData(data)
});
```
