---
id: accessing-query-results
title: Accessing Query Results
---

Once your query is created and executed, the next step is to actually use the data, whether you’re displaying it in a table, populating dropdowns, or using it in logic for another query. Let’s walk through how you can work with query results.

To better understand what your query is returning, use the Inspector panel. Click on the Inspect button, select your query from the query dropdown. You'll see the following keys:
-	**data**: The processed response returned from the query, this is what you typically bind to components.
-	**rawData**: The original API response, useful for debugging.
-	**isLoading**: A boolean indicating whether the query is currently running. Great for showing loaders or disabling buttons during fetches.

<img className="screenshot-full img-m" src="/img/app-builder/accessing-query-data/inspector.png" alt="App Builder: Query Panel"/>

You can pass query results to a component by using the `{{ }}` syntax. For example, if you have a query named *getEmployees*, you can pass its data to a Table component by setting the table's data property to `{{queries.getEmployees.data}}`. Learn more about binding queries to components [here](/docs/app-builder/connecting-with-data-sources/binding-data-to-components).

### Quick Actions
In the inspector, when you hover over a property like data, you’ll see two icons, you can see in the above image there are icons besides the data dropdown. These icons allow you to quickly copy either the path or value of that property. Here’s what they do:
1. Copy Path – Copies the full reference (e.g., `{{queries.getEmployees.data}}`) so you can paste it directly into component fields.
2. Copy Value – Copies the actual data returned, useful when inspecting values or mocking responses.

These icons are available for every property in the inspector, thus makes it easy to wire up your data to components without memorizing query names or manually typing syntax.
