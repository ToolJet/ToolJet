---
id: event-triggers
title: Defining Application Behaviour on Event Triggers
---

Events are used to define how your app should respond when a user interacts with a component or when a specific system condition is met. Whether it's clicking a button, selecting an item from a dropdown, or completing a data query, events let you tie in logic that makes your app interactive and reactive.

You can use event triggers to run queries, update variables, show alerts, navigate to different pages, and more. Each event can be configured to trigger one or more actions in sequence, allowing you to build complex logic flows easily. Refer to the individual [component guide](#) to see the full list of supported events, and check out the [Action Reference](#) for all available actions.

## Example: Submit Data on Button Click

You can use the On Click event to run a query when a user submits a form by clicking a button.

Suppose you’re building a feedback form that submits user input to your database. After setting up a query named **addData** that inserts form values into the database, you can bind the submit button with an event trigger:
- Event: **On Click**
- Action: **Run Query**
- Query: **addData** &nbsp; *(Select your insert query from the dropdown.)*

This setup ensures that every time the button is clicked, the form data is sent to your database.

***Add Screenshot***

## Example: Run a Follow-up Query After Successful Submission

You can add handlers to queries as well. For instance, after submitting data using one query, you might want to refresh your UI by fetching the updated data.

For that create two queries:
- addData – to insert new records.
- fetchData – to retrieve the latest data from the database.

Once the addData query runs successfully, you can automatically trigger fetchData by configuring an event handler on addData:
- Event: **Query Success**
- Action: **Run Query**
- Query: **fetchData** (Select your fetch query from the dropdown.)

This pattern helps maintain up-to-date views without requiring manual refreshes from the user.

***Add Screenshot***
