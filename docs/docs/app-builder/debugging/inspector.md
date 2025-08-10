---
id: inspector
title: Inspecting Values
---

ToolJet's Inspector is a built-in utility that provides real-time visibility into the data and state of your application. With Inspector, developers can quickly diagnose issues, understand the flow of data, and ensure that all components, queries, and variables are functioning as intended.
 
Inspector is accessible via the left sidebar in the App Builder. It is divided into six main sections, each offering a different perspective into your application’s runtime environment:

- [Queries](#queries)
- [Components](#components)
- [Globals](#globals)
- [Variables](#variables)
- [Page](#page)
- [Constants](#constants)

## Accessing Inspector

Values that are displayed inside the inspector can be referenced in other components and queries to create interactive applications. You can access the current state of components, queries, variables, page handle, and more directly from the inspector.

You can refer to a value using the dot notation (e.g., `{{components.numberInput1.value}}`), or hover over any property in the inspector to copy its reference path. This makes it easy to connect components, reuse data, and configure logic throughout your application without writing extra code.

For example, let's say you have a **Table** displaying a list of users, and you want to fetch the details of a particular user when they are selected. You can refer to the selected row's data using the reference path in the Inspector. 

You can either type this path manually or hover over the property in the Inspector to copy its path directly. This path can then be used in your query to refer to the value. Additionally, you can add an event handler to the table to automatically run this query whenever a user is selected.

<img className="screenshot-full img-s" src="/img/app-builder/debugging/inspector/copy-path.png" alt="Events Architecture Diagram"/>

### Queries

Under the Queries section, you can inspect the specifics of any query you’ve created. The data for a query is only visible after the query has been executed. This allows you to verify the output and troubleshoot any issues with data retrieval or manipulation. The Inspector exposes the following properties for each query:

- **isLoading** – A boolean indicating whether the query is currently in progress. This can be used to control the loading state of components that depend on the query's result.
- **data** – The transformed data returned by the query.
- **rawData** – The original response fetched from the data source.
- **id** – A unique identifier automatically assigned to every query in ToolJet.

Refer to the [Binding Data with Component](/docs/beta/app-builder/connecting-with-data-sources/binding-data-to-components) guide to learn how to bind the query data to the component.

### Components

The Components section provides a detailed view of each component present on your app’s canvas. You can see the current state, properties, and values of each component, helping you understand how data flows through your application and how components interact with each other. Only the components of the current page are visible in this section.

Each component exposes a different set of states and CSAs based on its functionality. For example:
- A **Text** component exposes a `text` state and a `setText` CSA.
- A **Checkbox** component exposes a `label` state and a `setValue` CSA.

To learn more about a specific component and its exposed properties, refer to the [individual component](/docs/beta/app-builder/building-ui/component-library) guide.

Refer to the [Accessing Component State](/docs/beta/app-builder/building-ui/component-state) guide to learn how to use component state.

### Globals

By using the Globals properties in the Inspector, you can view various details about your application and its environment, such as:
- **Current User** - Information about the logged-in user, including email, name, avatar, groups, roles, and SSO details. Useful for building role-based UI or showing personalized content.
- **Environment** - Indicates the current ToolJet environment — development, staging, or production.
- **Mode** - Indicates whether the app is opened in the editor or not.
- **Theme** - Refers to the active UI theme (light or dark). You can use this to dynamically style components based on the selected theme.
- **URL Params** - These are query parameters appended to the page URL, commonly used to pass data between pages.

### Variables

The Variables section in the Inspector lets you view all app-level variables available within the current application. These variables can be used to store and share data across components and queries. You can inspect their current values here, making it easier to debug and manage dynamic behavior in your app.

### Page

The Page section displays page-specific properties (such as page handle and name) and page-level variables. Unlike app-level variables, page-level variables are only accessible within their respective pages.

- **handle** - The page handle is a unique identifier used to generate a shareable URL for the page. It is appended as a slug to the end of your application URL.
- **id** - A unique identifier automatically assigned to every page in ToolJet.
- **name** - The display name of the page, shown in the app's navigation menu. Set by the user.
- **variables** - List of page level variables in the key-value pair.

### Constants

Workspace Constants are predefined values that you can use across different applications within your workspace. They are useful for storing frequently used data such as API URLs, configuration settings, or sensitive information like API keys and database credentials. In the inspector, you can view all constants as key-value pairs, secret constant values are masked for security.