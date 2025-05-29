---
id: event-triggers
title: Event Handler
---

Events are used to define how your app should respond when a user interacts with a component or when a specific system condition is met. Whether it's clicking a button, selecting an item from a dropdown, or completing a data query, events let you tie in logic that makes your app interactive and reactive.

You can use event triggers to run queries, update variables, show alerts, navigate to different pages, and more. Each event can be configured to trigger one or more actions in sequence, allowing you to build complex logic flows easily. Refer to the individual [component guide](#) to see the full list of supported events, and check out the [Action Reference](#) for all available actions.

<img className="screenshot-full img-full" src="/img/app-builder/events/dig.png" alt="Events Architecture Diagram"/>

## Configuring an Event Handler

Suppose you're building a feedback form that submits user input to a database whenever the user clicks on the submit button. To achieve this, you can configure the submit button to trigger a query when clicked. <br/>
First, create a query named **addData** that inserts form values into the database. Then, configure the submit button with the following event handler:
- Event: **On Click**
- Action: **Run Query**
- Query: **addData** &nbsp; *(Select your insert query from the dropdown.)*

This setup ensures that every time the button is clicked, the form data is sent to your database.

***Add Screenshot***

## Configuring Sequential Event Handler

Continuing the previous example, after submitting the form, you may want to update the UI by fetching the latest data. To do this, create a new query named **fetchData** that retrieves updated records from the database. <br/>
Next, configure a sequential event handler for the **addData** query:
- Event: **Query Success**
- Action: **Run Query**
- Query: **fetchData** (Select your fetch query from the dropdown.)

This setup ensures that the **fetchData** query is triggered automatically when the **addData** query completes successfully.

***Add Screenshot***
