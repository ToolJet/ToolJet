---
id: overview
title: Overview
---

In ToolJet, you can build dynamic, logic-driven applications using Events, Actions, Variables, and Component-Specific Actions (CSAs). These features let you define how your app responds to user interactions and system events without writing any backend code. Each component has a unique set of available events and CSAs based on its functionality. Refer to the [individual component](/docs/beta/app-builder/building-ui/component-library) guides for more details.

## Events

Events are triggers that respond when certain conditions are met — either through user interaction (for example, clicking a **Button** component or selecting a **Dropdown** option) or system-level changes (for example, the completion of a query). You can configure events using event handlers on components or queries. Each handler defines the trigger and the actions that should follow. 

For example, when a user clicks a **Button**, it can trigger a query to refresh data. Once that query completes, a second event can run to show a confirmation alert.

<img className="screenshot-full img-l" src="/img/app-builder/events/overview/events.png" alt="Events Architecture Diagram"/>

## Actions

Actions specify the outcome when an event is triggered. ToolJet supports a wide range of actions such as running queries, showing alerts, navigating between pages, copying text to the clipboard, and more. You can configure actions directly within event handlers or [dynamically using JavaScript](/docs/beta/app-builder/custom-code/control-components) via RunJS queries. For a complete list of available actions, refer to the [Action Reference](/docs/category/actions-reference) guide.

<img className="screenshot-full img-l" src="/img/app-builder/events/overview/actions.png" alt="Events Architecture Diagram"/>

## Component Specific Actions (CSAs)

Component-Specific Actions (CSAs) are built-in functions that allow you to control a component's state and behavior at runtime. Each component has its own set of CSAs based on its capabilities. For example, a **Text** component supports the `setText()` action, while a **Radio Button** component offers `selectOption()`.

<img className="screenshot-full img-l" src="/img/app-builder/events/overview/csa.png" alt="Events Architecture Diagram"/>

## Variables

Variables let you store and manage data either across your entire application or within specific pages. They're essential for maintaining state, controlling logic, and creating personalized user experiences.
ToolJet supports the following types of variables:

- App-level variables – accessible throughout the entire app.
- Page-level variables – scoped to a specific page.

<img className="screenshot-full img-s" src="/img/app-builder/events/overview/var.png" alt="Events Architecture Diagram"/>

<br/><br/>

In addition, ToolJet provides built-in [exposed variables](/docs/beta/app-builder/building-ui/component-state) for components and queries, which represent their current runtime state.

