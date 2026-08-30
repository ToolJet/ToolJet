---
id: transform-data
title: Transformer les données
---

Les données ne sont pas toujours disponibles dans un format directement utilisable depuis une seule source. Vous devrez souvent les transformer ou les combiner avant de les afficher. Les cas d'usage courants incluent :

- Fusionner des résultats provenant de plusieurs sources de données
- Restructurer des réponses d'API avant de les référencer dans des composants
- Appliquer une logique métier telle que le filtrage, le tri ou le regroupement
- Formater des champs comme des dates, des valeurs monétaires ou des objets JSON imbriqués

Si vous devez transformer les données d'une seule requête, vous pouvez utiliser l'option de [transformation](/docs/app-builder/connecting-with-data-sources/transforming-data) au sein de la requête.

<img className="screenshot-full img-full" style={{ marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/transformation_js.png" alt="App Builder: query transformations"/>

Cependant, si votre cas d'usage implique de combiner des données provenant de plusieurs requêtes ou composants, vous devrez utiliser des requêtes RunJS ou RunPy. 

Par exemple, imaginons que vous créez une application de gestion des stocks et souhaitez afficher une liste d'articles avec leurs niveaux de stock actuels. Vous disposez de données d'inventaire stockées dans une base de données PostgreSQL et de données produit provenant d'une ToolJet Database. Pour afficher les noms des articles avec leurs niveaux de stock actuels, vous devrez fusionner les résultats de ces deux requêtes à l'aide d'une requête RunJS, comme illustré ci-dessous.

<img className="screenshot-full img-full" style={{ marginBottom:'15px'}} src="/img/app-builder/custom-code/transformation_with_code.png" alt="App Builder: query transformations"/>

ToolJet vous permet d'écrire des requêtes RunJS ou RunPy pour effectuer ces transformations sans nécessiter de modifications de votre backend. Ce guide illustre comment transformer des données pour des cas d'usage réels.

## Comment ça fonctionne

ToolJet vous permet d'accéder à des données provenant de :
- Requêtes vers des sources de données configurées (par ex., PostgreSQL, API REST, MongoDB, etc.)
- Valeurs de composants (comme les champs de saisie, listes déroulantes, tableaux)

Avec les requêtes RunJS ou RunPy, vous pouvez écrire du code pour manipuler des données provenant de plusieurs sources. 

## Cas d'usage 

### 1. Fusionner des données provenant de deux API

Imaginons que vous souhaitiez afficher une liste d'utilisateurs avec leur nombre de commandes. Les données utilisateur proviennent d'une API REST, et les données de commande proviennent d'une base de données MySQL. Maintenant, si vous souhaitez afficher une liste combinée des utilisateurs avec leur nombre respectif de commandes, vous pouvez utiliser une requête RunJS ou RunPy pour combiner les résultats :

```js
// Assuming getUsers and getOrders are already defined as queries
// Run queries to fetch users and their orders
await queries.getUsers.run();
await queries.getOrders.run();

// Retrieve data from both queries
const userList = queries.getUsers.getData();    // Array of user records
const orderList = queries.getOrders.getData();  // Array of order records

// Enrich each user with their corresponding order count
const usersWithOrderCount = userList.map(user => {
  // Find all orders placed by the current user
  const userOrderHistory = orderList.filter(order => order.userId === user.id);

  return {
    ...user,
    orderCount: userOrderHistory.length
  };
});

return usersWithOrderCount;
```
<details id="tj-dropdown">

<summary>Data from getUsers query</summary>

```js
[
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Charlie", email: "charlie@example.com" },
  { id: 4, name: "David", email: "david@example.com" },
  { id: 5, name: "Eva", email: "eva@example.com" },
  { id: 6, name: "Frank", email: "frank@example.com" }
]
```

</details>

<details id="tj-dropdown">

<summary>Data from getOrders query</summary>

```js
[
  { id: 101, userId: 1, total: 120.00 },
  { id: 102, userId: 1, total: 45.50 },
  { id: 103, userId: 2, total: 89.99 },
  { id: 104, userId: 1, total: 60.00 },
  { id: 105, userId: 3, total: 150.00 },
  { id: 106, userId: 3, total: 200.00 },
  { id: 107, userId: 4, total: 75.00 },
  { id: 108, userId: 5, total: 50.00 },
  { id: 109, userId: 4, total: 90.00 }
]
```

</details>

<details id="tj-dropdown">

<summary>Data from usersWithOrderCount query</summary>

```js
[
  { id: 1, name: "Alice", email: "alice@example.com", orderCount: 3 },
  { id: 2, name: "Bob", email: "bob@example.com", orderCount: 1 },
  { id: 3, name: "Charlie", email: "charlie@example.com", orderCount: 2 },
  { id: 4, name: "David", email: "david@example.com", orderCount: 2 },
  { id: 5, name: "Eva", email: "eva@example.com", orderCount: 1 },
  { id: 6, name: "Frank", email: "frank@example.com", orderCount: 0 }
]
```

</details>

Vous pouvez maintenant référencer ces données dans votre application, par exemple, dans un composant **Table**.

### 2. Regrouper et trier des données avec une logique métier personnalisée

Imaginons que vous disposiez d'une liste de produits et souhaitiez les regrouper par catégorie et trier chaque groupe par stock (du plus élevé au plus faible). Cela permet d'afficher un inventaire organisé dans un composant tel qu'une liste imbriquée ou un tableau groupé. Vous pouvez utiliser une requête RunJS pour transformer les données :

```js
// Trigger the query and retrieve the data 
await queries.getProducts.run();
const products = queries.getProducts.getData();

const grouped = {};

products.forEach(product => {
  const category = product.category;
  if (!grouped[category]) {
    grouped[category] = [];
  }
  grouped[category].push(product);
});

// Sort each category group by stock in descending order
for (const category in grouped) {
  grouped[category].sort((a, b) => b.stock - a.stock);
}

return grouped;
```

Voilà comment utiliser les requêtes RunJS ou RunPy pour transformer des données dans ToolJet. Gardez à l'esprit que si l'écriture de code offre une grande flexibilité, elle peut aussi introduire de la complexité. Pensez toujours aux implications en termes de performance lorsque vous écrivez des transformations complexes.
