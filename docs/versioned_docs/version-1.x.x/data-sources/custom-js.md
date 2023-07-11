---
id: custom-js
title: Custom JavaScript
---

# Custom JavaScript

You can write custom JavaScript code to interact with components and queries. To do that, you just need to create a new query and select **Run JavaScript Code** from the data sources dropdown.


<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/custom-javascript.png" alt="custom js" />


#### Example: Displaying random number

- Let's drag a **button** and a **text** widget inside a container widget.
- Create a new query and select **Run JavaScript code** from dropdown.
- Write the code in **JavaScript editor** and save the query:
```jsx
const a = Math.floor(Math.random() * (10 - 1)) + 1;
return a;
```
:::tip

The return value is used as the `data` of the query.

:::
- Let's edit the properties of widgets:
    - Add an event handler to the button - Select **On Click** event, **Run Query** action, and select the `runjs1` query that we created. This will run the JavaScript code every time the button is clicked.
    - Edit the property of text widget - In the text field enter **Random number: `{{queries.runjs1.data}}`**. It will display the output as Random number: *result from JS code*


<img className="screenshot-full" src="/img/datasource-reference/custom-javascript/jsrandom.gif" alt="jsrandom" />



You can also write custom JavaScript code to get the data from **External APIs** and manipulate the response for graphical representation. Here's the [tutorial](https://blog.tooljet.com/build-github-stars-history-app-in-5-minutes-using-low-code/) on how we used custom JavaScript code to build an app using GitHub API.

### Libraries

ToolJet allows you to internally utilize these libraries:

| Name        | Documentation |
| ----------- | ----------- |
| Moment      | [https://momentjs.com/docs/](https://momentjs.com/docs/) |
| Lodash      | [https://lodash.com/docs/](https://lodash.com/docs/) |
| Axios       | [https://axios-http.com/docs/intro](https://axios-http.com/docs/intro) |

:::danger

Issues with writing custom JavaScript code? Ask in our [Slack Community](https://tooljet.com/slack).

:::