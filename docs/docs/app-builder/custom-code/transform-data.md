---
id: transform-data
title: Transforming Data
---

In many internal tools, the data you need to display doesn’t always come neatly from a single source. You might want to:
- Combine results from two different datasources.
- Modify the structure of your API response before rendering.
- Apply custom business logic like filtering, sorting, or grouping.
- Format fields like dates, currencies, or nested JSON before displaying.

This is where ToolJet’s Custom Code feature comes in handy. You can write JavaScript or Python queries to transform data from other queries or components without relying on changes to the backend. This doc explores practical use cases where transforming data becomes essential and shows how you can use ToolJet’s built-in scripting where you can write code to shape data the way your app needs.

## How it works?

ToolJet allows access to data from:
- Configured Datasource queries (e.g., PostgreSQL, REST APIs, MongoDB, etc.)
- Component values (like inputs, dropdowns, tables)

With custom code queries, you can:
- Write transformation functions
- Merge data from multiple sources
- Return the final output to be used in a component

You don’t need to modify your backend or write middleware, just write the logic where it’s needed.

If you want to execute a query using custom code, you must first define the query in the **Queries** section. Then, add a new query that uses the `run()` method to trigger the original query. Then you can use the `.getData()` method to retrieve its result. 

For example, if you have a query named `getUsers` and want to execute it via custom code, create a new query with the following code snippet:

```js
await queries.getUsers.run();
```

or

```js
await actions.runQuery('getUsers') 
```

The above code will execute the `getUsers` query. Now to retrieve the data returned by the `getUsers` query, use the `.getData()` method. Here's an example:

```js title="Custom Code Query"
await queries.getUsers.run(); // Execute the getUsers query
const users = queries.getUsers.getData(); // Retrieve the data returned by the getUsers query
```
The above query will execute the query and fetch all the users from the database. Now you can use this data to write a custom logic to merge the data into a format suitable for your UI.

## Use Cases 

### 1. Merging Data from Two APIs

Let's say you want to show a list of users with their order counts. The user data comes from one API, and the order data comes from a MySQL database. Now, if you want to show a combined list of users along with their respective order counts, you can use can use a JS query to combine the results.

```js title="JS Query"

// Assuming getUSers and getOrders are already defined as queries
 
await queries.getUsers.run();
await queries.getOrders.run();
// Both queries have run successfully at this point

// Get the data from both queries
const users = queries.getUsers.getData();
const orders = queries.getOrders.getData();

const merged = users.map(user => {
  const userOrders = orders.filter(order => order.userId === user.id);
  return {
    ...user,
    orderCount: userOrders.length
  };
});

return merged;
```

Now you can bind `{{queries.transformUsers.data}}` to a table component. 

### 2. Grouping and Sorting Data with Custom Business Logic

Let's say you have a list of products and want to group them by category and sort each group by stock (highest to lowest). This helps display organized inventory in a component like a nested list or grouped table. You can a JS query to transform the data.

```js title="JS Query"

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

This is how you can use custom code to transform data in ToolJet. With these examples, you should now have a clear understanding of how to use custom code to manipulate data from various sources and present it in the desired format. Keep in mind that while custom code offers flexibility, it can also introduce complexity. Always consider performance implications when writing complex transformations.