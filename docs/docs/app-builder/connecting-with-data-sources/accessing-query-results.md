---
id: accessing-query-results
title: Accessing Query Results
---

Once your query is created and executed, the next step is to actually use the data, whether you’re displaying it in a table, populating dropdowns, or using it in logic for another query. Let’s walk through how you can work with query results.

You can use `{{ }}` syntax to reference query data inside your components. For example, if you’ve created and run a query named *getEmployees*, you can access its result using `{{queries.getEmployees.data}}`. Now, you can bind this directly to a table’s data property to display employee details. Learn more about binding queries to components [here](/docs/app-builder/connecting-with-data-sources/binding-data-to-components).

## Explore and Debug with the Inspector

To better understand what your query is returning, use the Inspector panel. Click on the Inspect button, select your query from the query dropdown. You'll see the following keys:
-	data: The processed response returned from the query, this is what you typically bind to components.
-	rawData: The original API response, useful for debugging.
-	isLoading: A boolean indicating whether the query is currently running. Great for showing loaders or disabling buttons during fetches.

**Inspector Image**

### Quick Actions
In the inspector, when you hover over a property like data, you’ll see two icons:
1. Copy Path – Copies the full reference (e.g., `{{queries.getEmployees.data}}`) so you can paste it directly into component fields.
2. Copy Value – Copies the actual data returned, useful when inspecting values or mocking responses.

These icons are available for every property in the inspector, thus makes it easy to wire up your data to components without memorizing query names or manually typing syntax.




