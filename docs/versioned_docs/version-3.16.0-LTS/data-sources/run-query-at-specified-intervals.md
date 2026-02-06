---
id: run-query-at-specified-intervals
title: Run Query at Specified Intervals
---

In this guide, we'll walk through the process of building a ToolJet application that automates data retrieval at specific intervals. By utilizing the RunJS queries, we can set up intervals for triggering queries, ensuring that the data is fetched dynamically and efficiently.

## Step 1: Create a New Application

Begin by creating a new application in the ToolJet dashboard. Once the app builder opens, Drag a table component onto the canvas. This component will display the data fetched from the REST API query.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/setinterval/app-1.png" alt="Table Component With Data" />

## Step 2: Set Up a REST API Query

From the query panel, create a new REST API query. Utilize mock REST API data by choosing the 'GET' method and specifying the endpoint (e.g., `https://jsonplaceholder.typicode.com/posts`). Name the query 'post' and `Run` the query to ensure that the data is fetched successfully.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/setinterval/query-1.png" alt="ret api query with url" />

## Step 3: Configure Table Properties

In the Table properties, link the query data to the table by setting the 'table data' property to `{{queries.post.data}}`. This establishes the connection between the REST API query and the table component.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/setinterval/query-binding.png" alt="Table component with query binding" />

## Step 4: Implement the RunJS Query

Create a RunJS query to set up intervals for triggering the REST API query. Use the following script:

```js
actions.setVariable('interval', setInterval(countdown, 5000)); // 5000ms = 5 seconds

function countdown(){  // Function to trigger the REST API query
    queries.post.run(); // action to run the REST API query
}
```

Adjust the interval duration according to your needs. Optionally, utilize `async` and `await` for multiple actions within the countdown function.

```js
actions.setVariable('interval',setInterval(countdown, 5000));
async function countdown(){
  await queries.restapi1.run()
  await queries.restapi2.run()
  await actions.showAlert('info','This is an information')
}
```

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/setinterval/query-2.png" alt="query set interval" />

## Step 5: Advanced Configuration


From the Settings section of the RunJS query, enable **Run query on page load.** This ensures that the query is triggered when the application is loaded. Rename the query as 'setInterval' to complete the configuration.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/setinterval/settings-pageload.png" alt="settings" />

## Step 6: Prevent Indefinite Triggering

Create another RunJS query named 'clearInrternal' to stop the query from triggering indefinitely. Use the `clearInterval()` method to clear the interval. This method retrieves the value from the variable set in the 'setInterval' query.

```js
clearInterval(variables.interval);
```

## Step 7: Add a Button

Drag a button on the canvas to act as a user-triggered stop mechanism. Attach an event handler to execute the 'clear' query when the button is clicked.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/setinterval/button-query.png" alt="Button component" />

By following these steps, your ToolJet application will dynamically fetch data at specified intervals, providing an efficient and automated user experience.