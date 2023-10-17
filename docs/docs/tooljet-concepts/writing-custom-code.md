---
id: writing-custom-code
title: Writing Custom Code
---


Double curly braces can be used to enter custom code, access data returned by queries, access values passed inside components and other variables. 

## Accessing Values 

The `queries` keyword can be used to access data returned by queries. The general format to access queries is :

```js
{{queries.getSalesData.data}}
```

Similarly, the `components` keyword can be used to access data in the components and other related variables. 

The components keyword can be used to access the values and other variables related to components. 

```js
{{components.table1.selectedRow.id}}
```

## Writing Custom JavaScript Code

You can write custom JavaScript code to set colors, enable or disable toggles and more by passing in JavaScript code inside double courly braces. 

For example, to change Background Color of a button based on the the light or dark theme, you can use the below code:

```js
{{globals.theme.name = "light" ? "#375FCF" : "#FFFFFF"}}
```

Similary, to enable or disable a button based on user input, you can write a JavaScript code that returns true or false.

```js
{{components.form1.data.textinput1 = null ? true : false}}
```

You can see the list of all available values in the `Inspector` tab in the left sidebar. 

