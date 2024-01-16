---
id: actions
title: Actions
---

In ToolJet, actions are versatile functions that can be triggered by events within an app. Based on user interaction, actions can be configured to display alerts, run queries, switch pages, perform other tasks. 

## Types of Actions
ToolJet supports a variety of actions that can be triggered based on events like button clicks and succesful execution of queries. For instance, `Show alert` action displays a pop-up message, `Run query` executes data queries you've created, and `Open webpage` directs to a new webpage. Some of  the other actions include navigating to another ToolJet app, managing modals, copying text to the clipboard, setting values in localStorage, and generating downloadable files from application data.  

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px', marginBottom:'15px'}} className="screenshot-full" src="/img/tooljet-concepts/actions/actions-preview.png" alt="Preview Of Actions" />
</div>

## Ways to Configure Actions
Developers can configure the actions by setting up a **[new event](/docs/tooljet-concepts/what-are-events/)** in the configuration properties of a component or query. Alternatively, a **[RunJS query](/docs/how-to/run-actions-from-runjs/)** can be used to trigger actions based on user interactions or even on specific time intervals. 

Checkout all the available actions under the **[Actions Reference](/docs/actions/show-alert)** dropdown for more information.