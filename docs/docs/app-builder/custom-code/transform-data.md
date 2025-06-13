---
id: transform-data
title: Transforming Data
---

In your applications, the data you need will not always be in a ready-to-use format from a single source. Often, you’ll need to transform or combine data before displaying. Common use cases include:
- Merging results from multiple data sources
- Restructuring API responses before rendering in the components
- Applying business logic such as filtering, sorting, or grouping
- Formatting fields like dates, currency values, or nested JSON objects

If you need to transform data from a single query, you can use the [transformation](/docs/app-builder/connecting-with-data-sources/transforming-data) option available directly within the query itself as shown below.

<img className="screenshot-full img-full" style={{ marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/transformation_js.png" alt="App Builder: query transformations"/>

However, if your use case involves combining data from multiple queries or components, you’ll need to use RunJS or RunPy queries. 

For example, let's say you're building an invetory management application and want to display a list of items along with their current stock levels. You have inventory data stored in a PostgreSQL database and product data coming from a ToolJet Database. To display the item names alongside their current stock levels, you would need to merge the results from these two queries using a RunJS query. Here's how you could do it:

<img className="screenshot-full img-full" style={{ marginBottom:'15px'}} src="/img/app-builder/custom-code/transformation_with_code.png" alt="App Builder: query transformations"/>

ToolJet allows you to write JavaScript or Python queries to perform these transformations without requiring changes to your backend. This doc explores practical use cases where transforming data becomes essential and shows how you can write code to shape data the way your app needs.

## How it works?

ToolJet allows access to data from:
- Configured Datasource queries (e.g., PostgreSQL, REST APIs, MongoDB, etc.)
- Component values (like inputs, dropdowns, tables)

With RunJs or RunPy queries, you can write code to manipulate data from multiple sources. You don’t need to modify your backend or write middleware, just write the logic where it’s needed.

## Use Cases 

### 1. Merging Data from Two APIs

Let's say you want to show a list of users with their order counts. The user data comes from a REST API, and the order data comes from a MySQL database. Now, if you want to show a combined list of users along with their respective order counts, you can use can use a RunJS query to combine the results.

```js title="RunJS Query - usersWithOrderCount"

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

Now you reference this data in your app, for instance, in a **Table** component.

### 2. Grouping and Sorting Data with Custom Business Logic [change the example]

Let's say you have a list of products and want to group them by category and sort each group by stock (highest to lowest). This helps display organized inventory in a component like a nested list or grouped table. You can a JS query to transform the data.

```js title="JS Query"

await queries.getProducts.run();
//

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

This is how you can use RunJS or RunPy queries to transform data in ToolJet. With these examples, you should now have a clear understanding of how to use code to manipulate data from various sources and present it in the desired format. Keep in mind that while writing code offers flexibility, it can also introduce complexity. Always consider performance implications when writing complex transformations.