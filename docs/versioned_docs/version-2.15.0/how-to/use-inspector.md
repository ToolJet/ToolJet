---
id: use-inspector
title: Use Inspector
---

In this how-to guide, we will take a look at **Inspector** of the app-builder and see how it can be helpful in building applications.

The Inspector can be used to inspect the data of the queries, properties and values of the components that are there on the canvas, ToolJet's global variables and the variables that have been set by the user.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/use-inspector/inspector.png" alt="How to - Use Inspector" width="500" />

</div>

## Layout

Let's take a look at the layout of the Inspector panel:

- On the top-right, we have a **Pin** button to pin and unpin the inspector panel. This button can be useful when you want to see the live changes on inspector while triggering a query or performing some event/action on any component.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-inspector/pin.png" alt="How to - Use Inspector" width="500" />

    </div>

- At the bottom right, you can click and hold to resize the inspector.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-inspector/resize.png" alt="How to - Use Inspector" width="500" />

    </div>

- On hovering an item on the inspector, the **copy path** and **copy value** buttons will appear on the right of the item. Copying the path and pasting it onto the component property or query parameter will always get the dynamic value but using `Copy value` option will copy the current value of the item and will be static when pasted in a component property or query parameter.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-inspector/path.png" alt="How to - Use Inspector" width="500" />

    </div>

## Sections

The Inspector panel has the following 4 main sections:

- **[queries](#queries)**
- **[components](#components)**
- **[globals](#globals)**
- **[variables](#variables)**

### queries

The queries section can be used to inspect the query details but the data of the query will only be available if query has been run/triggered.

:::tip
You can click on the Preview button of the button on the query manager to check the response(data) of the query without triggering it.
:::

#### Example

- Let's create a new query using a mock REST API endpoint (`https://fakestoreapi.com/products`).
- Now go to the Inspector and expand the **queries** section, you'll see an entry inside queries with the query name that we created in the previous step i.e. `restapi1` but if you notice the `data` and `rawData` object is empty i.e. 0 entry. The reason is the data won't show up on the inspector unless query is run.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-inspector/data0.png" alt="How to - Use Inspector" />

    </div>

- Let's pin the inspector and then trigger the query from the query manager. You'll see that as soon as the query is triggered the `rawData` and `data` object in the query has 20 entries and the query has more properties like `request`, `response`, and `responseHeaders` data.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/use-inspector/data1.png" alt="How to - Use Inspector" />

    </div>

### components

components section can be used to inspect the properties and values of the components that are added onto the canvas.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/use-inspector/components.png" alt="How to - Use Inspector" width="500" />

</div>

### globals

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/use-inspector/globals.png" alt="How to - Use Inspector" width="500" />

</div>

The globals section consists of the following sub-sections:

- **currentUser:** The currentUser object contains information about the currently logged-in user, such as their **email**, **firstName**, and **lastName**.
- **groups:** The groups array contains the names of the groups to which the currently logged-in user belongs. Note: The `all_users` group is a default group for everyone.
- **theme:** The theme object contains the name of the currently active theme.
- **urlparams:** The urlparams contain information about the URL parameters of the application.
- **environment:** This variable holds two keys: **id** and **name**. The **id** is a unique identifier generated automatically, and the **name** holds the name of the currently opened environment of the app version.
- **modes:** This variable holds one of three values: **edit**, **preview**, or **view**, depending on the current state of the app. If the app is opened in editing mode, the mode will be set to **edit**. If the app is opened by clicking the preview button on the app builder, the variable will be set to **preview**. If the app is opened using the URL from the **Share** modal, the mode will be set to **view**.

:::tip
The **environment** and **mode** variables are only available in **ToolJet Enterprise Edition v2.2.3** and above.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/use-inspector/env.png" alt="How to - Use Inspector" width="500" />

</div>
:::

:::info
All the global variables can be accessed anywhere within ToolJet applications. Here's an **[example use-case](/docs/how-to/access-currentuser)** that demonstrates the usage of these variables.
:::

### variables

variables section include all the variables set by the user in the application. These variables can be set from the event handlers from the components or from the queries. The variables will be in the **key-value** pair and can be accessed throughout the application.

:::info

- Setting variables from the [event handler](/docs/actions/set-variable)
- Setting variables from the [Run JavaScript code](/docs/how-to/run-actions-from-runjs#set-variable)
  :::
