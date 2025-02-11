---
id: runjs-example-queries
title: RunJS Example Queries
---
### Generating a Random Number

This example demonstrates how to generate and display a random number using JavaScript.

1. Drag a **button** and a **text** widget inside a **container** widget.
2. Click on the **+ Add** on the query panel to create a query and select **Run JavaScript code** from the available datasources.
3. Write the code in **JavaScript editor** and run the query.

```js
const a = Math.floor(Math.random() * (10 - 1)) + 1;
return a;
```

4. Edit the properties of widgets:
    1. Add an event handler to the button:
        1. Select event as **On Click** 
        2. Action as **Run Query**
        3. Select the *runjs1* query that we created. This will run the JavaScript code every time the button is clicked.
    2. Edit the property of text widget:
        1. In the text field enter **Random number:** `{{queries.runjs1.data}}`. It will display the output as Random number: *result from JS code*

<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/random-num.png" alt="Run JavaScript code" />

### Generating a Unique ID

The following code generates a unique ID in the format "id" followed by a sequence of random hexadecimal characters.

```js
var id = "id" + Math.random().toString(16).slice(2);
return id;
```
For example, it could be something like "id2f4a1b".

<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/unique-id-1.png" alt="Run JavaScript code" />

### Generating a Timestamp-Based Unique ID

In this code, the resulting ID will have the format "timestamp + randomHex", where "timestamp" is the current time in base-32 and "randomHex" is a random hexadecimal value.

```js
return String(Date.now().toString(32) + Math.random().toString(16)).replace(/\./g, '');
```

This ID will be longer than the one generated earlier, and it could look like "2g3h1d6a4h3".

<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/unique-id-2.png" alt="Run JavaScript code" />

:::tip Resources
- You can also write custom JavaScript code to get the data from **External APIs** and manipulate the response for graphical representation. Here's the [tutorial](https://blog.tooljet.com/build-github-stars-history-app-in-5-minutes-using-low-code/) on how we used custom JavaScript code to build an app using GitHub API.
- [Import external libraries](/docs/how-to/import-external-libraries-using-runjs) using RunJS.
- [Intentionally Fail](docs/how-to/intentionally-fail-js-query) a RunJS query.
- [Trigger query at specified intervals](/docs/how-to/run-query-at-specified-intervals) using RunJS.
:::



