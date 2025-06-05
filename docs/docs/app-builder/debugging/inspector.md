---
id: inspector
title: Using Inspector
---

Inspector in ToolJet is a built-in utility that helps you inspect and understand your application’s state at runtime. You can use these states to display data or trigger actions, such as showing a loading indicator or conditionally setting the visibility of components, etc. It gives you real-time visibility into:

- [Queries](#queries)
- [Components](#components)
- [Globals](#globals)
- [Variables](#variables)
- [Page](#page)
- Constants

You can hover over any property to copy its reference path. This path can then be used to bind the value to components or expressions in your app. 

<img className="screenshot-full img-s" src="/img/app-builder/debugging/inspector/copy-path.png" alt="Events Architecture Diagram"/>

## Queries

You can use the Inspector to view the current state of any query in your app. This is helpful to understand how a query behaves and the data fetched. The Inspector exposes the following properties for each query:
- **isLoading** – A boolean indicating whether the query is currently in progress.
- **data** – The transformed data returned by the query. If no transformation is applied, data will be the same as rawData.
- **rawData** – The original response fetched from the data source, before any transformation is applied.
- **id** – A unique identifier automatically assigned to every query in ToolJet.

Refer to the [Binding Data with Component](/docs/app-builder/connecting-with-data-sources/binding-data-to-components) guide to learn how to bind the query data to the component.

## Components

Each component in ToolJet maintains a state — a collection of values that represent its current data and configuration. You can use the Inspector to view these states, along with Component Specific Actions (CSAs) that allow you to programmatically update them.

Each component exposes a different set of states and CSAs based on its functionality. For example:
- A **Text** component exposes a `text` state and a `setText` CSA.
- A **Checkbox** component exposes a `label` state and a `setValue` CSA.

To learn more about a specific component and its exposed properties, refer to the [individual component](#) guide.

Refer to the [Accessing Component State](#) guide to learn how to use component state.

## Globals

By using the Globals properties in the Inspector, you can view various details about your application and its environment, such as:
- **Current User**: Information about the logged-in user, including email, name, avatar, groups, roles, and SSO details. Useful for building role-based UI or showing personalized content.
- **Environment**: Indicates the current ToolJet environment — development, staging, or production.
- **Mode**: Signify whether the app is opened in the editor or not.
- **Theme**: Refers to the active UI theme (light or dark). You can use this to dynamically style components based on the selected theme.
- **URL Params**: These are query parameters appended to the page URL, commonly used to pass data between pages.

## Variables

The Variables property in the Inspector lets you view all app-level variables available within the current application. These variables can be used to store and share data across components and queries. You can inspect their current values here, making it easier to debug and manage dynamic behavior in your app.

## Page

