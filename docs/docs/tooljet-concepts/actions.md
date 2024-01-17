---
id: actions
title: Actions
---

In ToolJet, actions are versatile functions that can be triggered by events within an app. Based on user interaction, actions can be configured to display alerts, run queries, switch pages, and perform other tasks. 

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Types of Actions
ToolJet supports a variety of actions. For instance, Show alert action displays a pop-up message, Run query executes data queries you've created, and Open webpage directs to a new webpage. Some of  the other actions include navigating to another ToolJet app, managing modals, copying text to the clipboard, setting values in localStorage, and generating downloadable files from application data.  

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/actions/actions-preview.png" alt="Preview Of Actions" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Ways to Configure Actions

Actions can be triggered in response to various events, such as button presses or successful query executions. To set up actions, you can establish a **[new event](/docs/tooljet-concepts/what-are-events/)** within the configuration settings of any component or query. Alternatively, for more dynamic interactions, you can utilize a **[RunJS query](/docs/how-to/run-actions-from-runjs/)**. This approach enables action triggering based on user interactions or even at designated time intervals.

</div>

Checkout all the available actions under the **[Actions Reference](/docs/actions/show-alert)** dropdown for more information.