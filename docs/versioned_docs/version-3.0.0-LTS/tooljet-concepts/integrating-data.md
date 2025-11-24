---
id: integrating-data
title: Queries
---

Queries allows you to interact with various data sources, such as databases, APIs, and third-party services. They act as the bridge between your application's components and the data you wish to display, manipulate, or store. 

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px'}} className="screenshot-full" src="/img/tooljet-concepts/integrating-data/query-example.png" alt="Styles Tab" />
</div>

These queries are constructed in the Query Panel in the App-Builder, a dedicated section within the ToolJet App-Builder, where you can write low-code or custom SQL statements, API requests, or other data retrieval methods.

## Configuring Queries
You can configure queries to run automatically when an application loads, or trigger them based on specific events or user actions. For example, you could set up a query to run when a user clicks a button, fills out a form, or selects an item from a dropdown menu. This enables you to create dynamic, interactive applications.

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px'}} className="screenshot-full" src="/img/tooljet-concepts/integrating-data/trigger-query.png" alt="Trigger Query" />
</div>


## Integration of Queries and Components
Queries are deeply integrated with ToolJet's components. Once a query fetches data, you can easily bind that data to various components in your application using ToolJet's templating syntax. Similarly, you can use queries to create, write or update data and trigger them on button clicks and other events.  


