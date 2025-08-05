---
id: overview
title: Overview
---

ToolJet’s app-builder offers an AI-native, low-code environment that helps you build and deploy internal tools quickly without extensive coding knowledge. Whether it’s dashboards, approval workflows, tracking systems, or scheduling apps, you can create powerful tools in minutes.

Teams across engineering, product, operations, and business can build applications with ease, following four simple steps to get up and running in minutes.

1. **Build the Interface** – Design visually with drag-and-drop components.

2. **Connect Your Data** – Integrate with databases, APIs, and third-party services.

3. **Make It Interactive** – Add actions, events, and logic to bring your application to life.

4. **Handle Complex Logic** – Use JavaScript anywhere for advanced workflows.

In this guide, you’ll walk through each step and see how they fit together to bring your application to life.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/banner.png" alt="Components Preview" /> </div>


## 1.  Building the Interface

Start designing your application’s interface with 60+ pre-built components, from **Tables** and **Forms** to **Charts** and **Buttons**. Just drag and drop components onto the canvas, resize, reposition, and fine-tune them through the Properties Panel.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/components.png" alt="Components Preview" /> </div>

Each component comes with built-in styling options. You can customize text, colors, visibility, and more through the Style Panel. These components are dynamic, allowing you to manage state and events just like you would in your favorite frontend framework.

## 2. Connecting Your Data

You can connect your application to multiple [data sources](/docs/data-sources/overview) including SQL, NoSQL, vector databases, APIs, spreadsheets, and cloud services. Once connected, you can fetch, update, or manipulate data using queries.

A query is an action that interacts with your data source, whether it's fetching records, filtering results, or writing data. It acts as the bridge between your UI and your data.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/queries.png" alt="Queries Preview" /> </div>


Use the **Query Panel** to build queries, either with a form-based interface or by writing code/SQL directly. You can use them to fetch data to display in components or to push user inputs back to your database. They can run manually or be triggered using events like page load, user actions on components, or the success or failure of other queries.

## 3. Making Apps Interactive 

Make your apps interactive by adding events to components, queries, and pages. Events define how your application responds to user actions or specific conditions, bringing interactivity to your application. ToolJet provides a declarative Events system, similar to JavaScript event handlers, allowing you to control application behavior without writing repetitive code.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/events.png" alt="Events Preview" /> </div>

Events can be triggered by various actions such as a button click, form submission, page load, or the completion of a query. When triggered, you can execute actions like running a query, opening a modal, showing a notification, or navigating to another page.

You can also chain multiple events and actions together, enabling complex multi-step workflows without writing boilerplate code.

## 4. Handling Custom Logic

ToolJet makes it easy to build apps without code, but when you need more control, it offers the ability to add custom code to write your logic. You can create JavaScript or Python queries in application builder to perform calculations, transform data, trigger other queries, or update UI components. These snippets have full access to the component’s properties, other queries’ outputs, and the entire app’s state, allowing you to write custom logic for any use cases like conditional behavior, data processing, or dynamic UI updates.

<div style={{textAlign: 'center', marginBottom:'15px'}}> <img className="screenshot-full img-full" src="/img/app-builder/overview/custom-code.png" alt="Custom Code Preview" /> </div>

This gives developers the ability to handle complex scenarios with code, while still leveraging ToolJet’s low-code environment.

## Use Cases
With ToolJet, you can build a wide range of internal tools including but not limited to:

* Inventory management system
* Purchase order tracker
* Customer onboarding portal
* Loan origination and underwriting tool
* Fraud detection dashboard
* Expense approval workflow
* Timesheet tracker
* Employee onboarding app
* Internal ticketing system
* Compliance reporting dashboard
* Sales pipeline tracker
* Digital asset management portal

From simple dashboards to complex data-driven tools, ToolJet's app-builder helps you build applications with speed and precision.