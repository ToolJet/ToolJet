---
id: overview
title: Overview
---

ToolJet’s app builder enables your to build and ship your internal tools quickly without extensive coding knowledge. You can build internal tools like dashboards, workflow approvals, tracking and scheduling applications quickly. 

Teams across engineering, product, operations, and business can build applications with ease, following four simple steps to get up and running in minutes.

1. **Build the Interface** – Design visually with drag-and-drop components.

2. **Connect Your Data** – Integrate with databases, APIs, and third-party services.

3. **Make It Interactive** – Add actions, events, and logic to bring your app to life.

4. **Handle Complex Logic** – Use JavaScript anywhere for advanced workflows.

In this guide, we’ll walk you through each step and show you how they fit together to make your app come alive.

***Screenshot with App-Builder's Overview***


## 1.  Building the Interface

Start designing your app’s interface with 60+ pre-built components, from tables and forms to charts and buttons. Just drag and drop components onto the canvas, resize, reposition, and fine-tune them through the Properties Panel.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/components.png" alt="Components Preview" /> </div>

Each component comes with built-in styling options. You can customize text, colors, visibility, and more through the Style Panel. These components are dynamic, allowing you to manage state and events just like you would in your favorite frontend framework.

## 2. Connecting Your Data

You can connect your app to multiple [data sources](/docs/data-sources/overview) including SQL, NoSQL or vector databases, APIs, spreadsheets, and cloud services. Once connected, you can fetch, update, or manipulate data using queries.

A query is an action that interacts with your data source, whether it's fetching records, filtering results, or writing back data. It act as the bridge between your UI and your data.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/queries.png" alt="Queries Preview" /> </div>


Use the Query Panel to build queries, either with a form-based interface or by writing code/SQL directly. You can use them to fetch data to display in components or to push user inputs back to your database.They can run manually or be triggered using events like page load, user actions on components, or the success or failure of other queries.

## 3. Making Apps Interactive 

Make your apps interactive by adding events to components, queries, and pages. Events define how your app responds to user actions or specific conditions, bringing interactivity to your application. ToolJet provides a declarative Event Handler system, similar to JavaScript event handlers, allowing you to control app behavior without writing repetitive code.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/events.png" alt="Events Preview" /> </div>

Events can be triggered by various actions such as a button click, form submission, page load, or the completion of a query. When triggered, you can execute actions like running a query, opening a modal, showing a notification, or navigating to another page.

You can also chain multiple events and actions together, enabling complex multi-step workflows without writing boilerplate code.

## 4. Handling Custom Logic

ToolJet makes it easy to build apps without code, but when you need more control, it offers the ability to add custom code to write your custom logic. You can create JavaScript or Python queries in app builder to perform calculations, transform data, trigger other queries, or update UI components. These snippets have full access to the component’s properties, other queries’ outputs, and the entire app’s state, allowing you to write custom logic for any use cases like conditional behavior, data processing, or dynamic UI updates.
<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/custom-code.png" alt="Custom Code Preview" /> </div>

This gives developers the ability to handle complex scenarios with code, while still leveraging ToolJet’s low-code environment.

Combining the speed of low-code with the ability to write custom code where needed, you can build anything from simple dashboards to complex workflows, all in one platform.

## Usecases
Here are some examples of what you can achieve with ToolJet:
* Store inventory tracker
* Warehouse picking & packing app
* Digital loan processing app
* Underwriting portal
* Fraud detection app
* Customer onboarding portal
* Customer support assistant
* Digital asset management portal
* Regulatory compliance reporter
* Field service dispatch system
* Time sheet tracker
* Software license management app

Learn more about these usecases here: [https://www.tooljet.ai/templates](https://www.tooljet.ai/templates)
