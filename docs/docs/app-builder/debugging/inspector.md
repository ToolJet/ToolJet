---
id: inspector
title: Using Inspector
---

Inspector in ToolJet is a built-in utility that helps you inspect and understand your application’s state at runtime. You can use these states to display data or trigger actions, such as showing a loading indicator or conditionally setting the visibility of components, etc. It gives you real-time visibility into:

- [Queries](#queries)
- Components
- Globals
- Variables
- Page
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

Each component in ToolJet maintains a state — a collection of values that represent its current data and configuration. You can check this states and component specific actions (CSAs) using the inspector. Each component has a different set of states and CSAs based on it's functionality. Such as a Text component offers text state and setText CSA, while a Checkbox component offers a label state and setValue CSA. For detailed information on any specific component and its exposed variables, refer to the individual component guide.

Refer


Using the inspector element you can check all the available states and component specific actions of a component 





