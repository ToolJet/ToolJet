---
id: overview
title: Overview
---

In ToolJet, you can build dynamic, logic-driven applications using Events, Actions, Variables, and Component-Specific Actions (CSAs). These features let you define how your app responds to user interactions and system events — without writing any backend code. Each component has a different set of available events and CSAs based on its functionality. Refer to the [individual component](#) guides for more details.

## Events

Events are triggers that respond when certain conditions are met — either through user interaction (for example, clicking a button or selecting a dropdown option) or system-level changes (for example, the completion of a query). You can configure events using event handlers on components or queries. Each handler defines the trigger and the actions that should follow. <br/>
For example, when a user clicks a button, it can trigger a query to refresh data. Once that query completes, a second event can run to show a confirmation alert.

## Actions

Actions define what should happen when an event is triggered. ToolJet supports a wide range of actions such as running queries, showing alerts, navigating between pages, copying text to the clipboard, and more. You can configure actions directly within event handlers or [dynamically using JavaScript](#) via RunJS queries. For a complete list of available actions, refer to the [Action Reference](#) guide.

## Component Specific Actions (CSAs)

Component-Specific Actions (CSAs) are built-in functions that allow you to control a component state and behavior at runtime. Each component has its own set of CSAs based on its capabilities. For example, a Text component supports the `setText()` action, while a Radio Button component offers `selectOption()`.

## Variables

Variables let you store and manage data either across your entire application or within specific pages. They're essential for maintaining state, controlling logic, and creating personalized user experiences.
ToolJet supports the following types of variables:
- App-level variables – accessible throughout the entire app.
- Page-level variables – scoped to a specific page.

In addition, ToolJet also provides built-in [exposed variables](#) for components and queries, which reflect the current state of those components or queries at runtime.

