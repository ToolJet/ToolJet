---
id: writing-custom-code
title: Writing Custom Code
---

In ToolJet, Double curly braces can be used to enter custom code, access data returned by queries, access values passed inside components and other variables. 

### Accessing Values 

The **queries** keyword can be used to access data returned by queries. The general format to access queries is `queries.queryName.data`. For example:

```js
{{queries.getSalesData.data}}
```

Similarly, the **components** keyword can be used to access data in the components and other component-related variables. For example:

```js
{{components.table1.selectedRow.id}}
```

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/writing-custom-code/inspector.png" alt="Check Available Values Using Inspector" />
</div>

You can see the list of all accessible values in the **Inspector** tab in the left sidebar. 

### Writing Custom JavaScript Code

You can write custom JavaScript code to set colors, enable or disable toggles and more by passing in JavaScript code inside double courly braces. 

For example, to change Background Color of a button based on the the light or dark theme **[using fx](using-fx)**, you can use the below code that returns a string value of hex code:

```js
{{globals.theme.name = "light" ? "#375FCF" : "#FFFFFF"}}
```

Similary, to enable or disable a button based on user input **[using fx](using-fx)**, you can write a JavaScript code that returns true or false.

```js
{{components.form1.data.textinput1 = null ? true : false}}
```

