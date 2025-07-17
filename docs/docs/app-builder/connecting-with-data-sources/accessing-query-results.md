---
id: accessing-query-results
title: Accessing Query Results
---

Once your query is created and executed, the next step is to actually use the data, whether you’re displaying it in a table, populating dropdowns, or using it in logic for another query. Let’s walk through how you can work with query results.

To better understand what your query is returning, use the Inspector panel. Click on the Inspect button, select your query from the query dropdown. You'll find the following keys:
-	**data**: The processed response returned from the query. This is the data you typically bind to components.
-	**rawData**: The original API response. It's useful for debugging.
-	**isLoading**: A boolean indicating whether the query is currently running. Great for showing loaders or disabling buttons during fetches.

<img className="screenshot-full img-s" src="/img/app-builder/accessing-query-data/inspector.png" alt="App Builder: Query Panel"/>

<br/>

You can pass query results to a component by using the `{{ }}` syntax. For example, if you have a query named *getEmployees*, you can pass its data to a Table component by setting the table's data property to `{{queries.getEmployees.data}}`. Learn more about binding queries to components [here](/docs/app-builder/connecting-with-data-sources/binding-data-to-components).

### Quick Actions
In the Inspector panel, when you hover over a property like data, you’ll see two icons. These icons allow you to quickly copy either the path or value of that property. Here’s what they do:
1. Copy Path - Copies the full path (e.g., `{{queries.getEmployees.data}}`) so you can reference it directly into component fields.
2. Copy Value - Copies the actual data returned, useful when inspecting values or mocking responses.

These icons are available for every property, making it easier to wire up your data to components.