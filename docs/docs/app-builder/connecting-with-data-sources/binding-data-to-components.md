---
id: "binding-data-to-components"
title: Binding data to components
---

In this section, you’ll learn how to connect and bind data to components within ToolJet, whether the data comes from a datasource or other components in your app.

You can display data from your datasource queries in the components like tables, charts, dropdowns etc., using the 
`{{ }}` syntax. You can use the following format: `{{ queries.<query-name>.data }}`

For example, you are working on a Employee Directory app where you want to show all employees in a table. If you have a query named *listEmployees*, that returns an array of employee objects, you can pass its data to a Table component by setting the table's data property to `{{queries.listEmployees.data}}`.

<img className="screenshot-full img-full" style={{marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/binding.png" alt="App Builder: bininding data to components"/>


ToolJet also supports JavaScript expressions inside `{{ }}`, so you can manipulate the data on the fly. Here are a few usecases:

## Use cases
### Filtering Data
If you want to show only employees from the ‘Engineering’ department:

```js
{{ queries.listEmployees.data.filter(employee => employee.department === 'Engineering') }}
```
### Map Data

If you want to show only employee names in a dropdown:

```js
{{ queries.listEmployees.data.map(employee => employee.name) }}
```

### Conditional Rendering

If you want to show a greeting if an employee is selected in a table:

```js
{{ table1.selectedRow ? `Hello, ${table1.selectedRow.name}` : "" }}
```

### Chaining Expressions

You can also chain multiple JavaScript methods for more complex transformations. For example, filtering and then mapping:

```js
{{ queries.listEmployees.data
     .filter(emp => emp.department === 'Engineering')
     .map(emp => emp.name.toUpperCase()) }}
```

These expressions give you control over how data is displayed and interacted with inside your ToolJet applications.