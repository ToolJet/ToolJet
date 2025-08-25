---
id: run-js
title: Run JavaScript Code
---
The **Run JavaScript Code** feature in ToolJet allows custom JavaScript code to be executed to enhance application interactivity. This feature is useful for performing calculations, generating values, or interacting with queries and components.

<div style={{paddingTop:'24px'}}>

## Creating a Run JavaScript Query

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select **Run JavaScript Code** from the list of available data sources.
3. Add the JavaScript Code.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/create-query.png" alt="Run JavaScript code" />

</div>

<div style={{paddingTop:'24px'}}>

## Parameters in Run JavaScript Code

Parameters allow for dynamic control over the JavaScript code execution without altering the core script. This provides flexibility by allowing the same code to execute with different inputs.

Each parameter requires:
- **Name**: Name for the parameter
- **Default value**: The value can be constant strings, numbers and object.

### Steps to Add a Parameter

1. In the RunJS query editor, click the **Parameters +** button to create a new parameter.
2. Provide a **Name** for the parameter.
3. Set a Default **Value**, which can be a string, number, or object.

Once added, the **parameter can be referenced in the code using the syntax**: `parameters.<name>`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/js-param.png" alt="Run JavaScript code" />

</div>

### Displaying a Parameter Value in an Alert Box

Let's create a new parameter named *newAlert* and set the value as object `Displaying the Parameter Value in an Alert Box` and use the alert js method to show the value on the pop-up.

Syntax:
```
alert(parameters.newAlert)
```

When the query is triggered the alert will show the parameters value.

<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/param-alert.png" alt="Run JavaScript code" />

### Calling Another Query with Parameters

Parameters can also be used to trigger other queries and pass custom values. Below is an example of how to call one query from another by providing custom parameters.

1. Begin by creating a new RunJS query named *multiply*. 
    - In this query, add the following parameters: 

        - *num1* with a default value of **10**
        - *num2* with a default value of **2**.
    - Add the following JavaScript Code:

    ```javascript
    return parameters.num1 * parameters.num2;
    ```
    - To display the result, place a text component on the canvas and set its text to `{{queries.multiply.data}}`.
    <br/>
    <img className="screenshot-full" src="/img/datasource-reference/custom-javascript/multiply-v2.png" alt="Run JavaScript code" />

2. Now, let's create another RunJS query called *callMultiply*, where we will invoke the *multiply* query created earlier using custom parameter values. Here's the code snippet for *callMultiply*:
 
    ```js
    queries.multiply.run({num1: 20, num2: 7})
    ```
 
    By executing this code within *callMultiply*, we trigger the *multiply* query with specific values for its parameters.
 
    <img className="screenshot-full" src="/img/datasource-reference/custom-javascript/call-multiply-v2.png" alt="Run JavaScript code" />

With this setup, the *multiply* query can be called from other queries, such as *callMultiply*, by providing custom parameter values. This allows you to reuse the *multiply* query with different inputs and display the results accordingly.

</div>

<div style={{paddingTop:'24px'}}>

## RunJS Example Queries

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
- You can also write custom JavaScript code to get the data from **External APIs** and manipulate the response for graphical representation. Here's the [tutorial](https://blog.tooljet.ai/build-github-stars-history-app-in-5-minutes-using-low-code/) on how we used custom JavaScript code to build an app using GitHub API.
- [Import external libraries](/docs/how-to/import-external-libraries-using-runjs) using RunJS.
- [Intentionally Fail](/docs/how-to/intentionally-fail-js-query) a RunJS query.
- [Trigger query at specified intervals](/docs/how-to/run-query-at-specified-intervals) using RunJS.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Libraries

ToolJet allows you to internally utilize these libraries:

| Name        | Documentation |
| ----------- | ----------- |
| Moment      | [https://momentjs.com/docs/](https://momentjs.com/docs/) |
| Lodash      | [https://lodash.com/docs/](https://lodash.com/docs/) |
| Axios       | [https://axios-http.com/docs/intro](https://axios-http.com/docs/intro) |

:::info
Issues with writing custom JavaScript code? Ask in our [Slack Community](https://tooljet.com/slack).
:::

</div>
