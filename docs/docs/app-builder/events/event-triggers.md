---
id: event-triggers
title: Setting Up Events
---

Events define how your app should respond when a user interacts with a component or when a specific system condition is met. Whether it's clicking a **Button** component, selecting an item from a **Dropdown**, or completing a query, events let you tie in logic that makes your app interactive and reactive.

You can use event triggers to run queries, update variables, show alerts, navigate to different pages, and more. Each event can be configured to trigger one or more actions in sequence, allowing you to build complex logic flows easily. Refer to the individual [component guide](/docs/beta/app-builder/building-ui/component-library) to see the full list of supported events, and check out the [Action Reference](/docs/category/actions-reference) for all available actions.

## Configuring an Event Handler

Suppose you're building a feedback form using a **Form** component that submits user input to a database whenever the user clicks on the submit button. To achieve this, you can configure the submit button to trigger a query when clicked.

First, create a query and name it *addData*. This query inserts **Form** values into the database. Then, configure the **Button** with the following event handler:
- Event: **On Click**
- Action: **Run Query**
- Query: **addData** 

<img className="screenshot-full img-l" src="/img/app-builder/events/event-handler/form.png" alt="Events Architecture Diagram"/>

This setup ensures that every time the button is clicked, the **Form** data is sent to your database.

<img className="screenshot-full img-full" src="/img/app-builder/events/event-handler/dig.png" alt="Events Architecture Diagram"/>

## Configuring Sequential Event Handler

Continuing the previous example. After submitting the form, you may want to update the UI by fetching the latest data. To do this, create a new query and name it *fetchData* that retrieves updated records from the database.

Next, configure an event handler that runs sequentially after the *addData* query succeeds:
- Event: **Query Success**
- Action: **Run Query**
- Query: **fetchData** 

<img className="screenshot-full img-full" src="/img/app-builder/events/event-handler/query.png" alt="Events Architecture Diagram"/>

This setup ensures that the *fetchData* query is triggered automatically when the *addData* query completes successfully.

<img className="screenshot-full img-full" src="/img/app-builder/events/event-handler/query-dig.png" alt="Events Architecture Diagram"/>

Whether it's submitting a form, running a query, or updating your UI, events and actions let you define dynamic, logic-driven behavior without writing backend code. 