---
id: overview
title: Visual Builder
sidebar_label: Overview
---

The Visual Builder builds ToolJet applications on a canvas. Components are dragged onto the canvas, connected to datasources through queries, and made interactive with events and actions. RunJS and RunPy queries handle logic that the built-in options don't cover.

A visual application is built in four steps:

1. **Build the Interface**: Drag components onto the canvas and configure them.
2. **Connect Data**: Connect datasources and create queries.
3. **Add Interactivity**: Configure events and actions.
4. **Add Custom Logic**: Write RunJS and RunPy queries for advanced logic.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/banner.png" alt="Components Preview" /> </div>

## 1. Build the Interface

Components such as **Tables**, **Forms**, **Charts** and **Buttons** come from the [component libraries](../building-ui/component-library.md). Components are dragged onto the canvas, resized and repositioned, and configured in the Properties panel.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/components.png" alt="Components Preview" /> </div>

Each component has styling options for text, colors, visibility and more in the Styles panel. Components expose their state and trigger events.

## 2. Connect Data

An application connects to [datasources](../../data-sources/overview.md) such as SQL and NoSQL databases, vector databases, APIs, spreadsheets and cloud services. Queries fetch, update or change the data in a datasource, and connect the interface to the data.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/queries.png" alt="Queries Preview" /> </div>

Queries are built in the **Query Panel**, with a form-based interface or by writing code or SQL. A query can show data in components or write user input back to a datasource. Queries run manually, or are triggered by events such as a page load, a user action on a component, or the success or failure of another query. See [Creating and Managing Queries](../connecting-with-data-sources/creating-managing-queries.md).

## 3. Add Interactivity

Events define how an application responds to user actions and other conditions. Events can be added to components, queries and pages. ToolJet's declarative events system works like JavaScript event handlers, without repetitive code.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/events.png" alt="Events Preview" /> </div>

An event is triggered by an action such as a button click, a form submission, a page load or a completed query. The event then runs an action, such as running a query, opening a modal, showing a notification or navigating to another page. Events and actions can be chained into multi-step workflows. See [Events and Actions](../events/overview.md).

## 4. Add Custom Logic

For logic that the built-in options don't cover, RunJS and RunPy queries run custom code. They can perform calculations, transform data, trigger other queries or update components. The code has access to component properties, query results and the application's state. See [Writing Custom Code](../custom-code/fx-dynamic-behaviour.md).

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/custom-code.png" alt="Custom Code Preview" /> </div>

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
