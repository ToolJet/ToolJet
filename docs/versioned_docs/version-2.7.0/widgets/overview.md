---
id: overview
title: Overview
---

# Components: Overview

Components are used to build the UI of the applications. They can be dragged onto the canvas from the Component Library and can be modified from the Properties Panel without needing to write any code. **[Event Handlers](/docs/2.7.0/widgets/overview/#component-event-handlers)** in Components allow end users to trigger queries and other application events to perform the **[Actions](/docs/category/actions-reference)**.

## Adding components

Components can be dragged and dropped from the Component Library(from the right side on app builder) on to the canvas. Components can be moved by simply click and hold, and can be resized from edges or borders.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/overview/dragv2.gif" alt="Components: Overview" />

</div>

### Select multiple components

For moving the **multiple components** at once, simply **shift+click**, to select multiple components. Once grouped, the components can be moved on the canvas while maintaining their relative positions.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/overview/selectv2.gif" alt="Components: Overview" />

</div>

You can also create a selection triangle and move multiple components together by `click and drag`

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/overview/dragselv2.gif" alt="Components: Overview" />

</div>

:::tip
You can also use many other **[Keyboard Shortcuts](/docs/tutorial/keyboard-shortcuts)** in ToolJet to copy, cut, paste components to the canvas.
:::

## Component properties

Each Component can be modified and styled from the Properties Panel such as the **data** field, a toggle for **disabling** the component, or stylings like a **background color**. Properties can be modified directly or programmatically by using **[Bindings](#bindings)**, which enables you to write JavaScript code.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/overview/props.png" alt="Components: Overview" />

</div>

## Component Event Handlers

Event Handlers can be found in the Component's **Property Panel** or in the **Advanced** section of the Query. Event handlers can be used to trigger the queries, perform **[Component Specific Actions - CSA](/docs/actions/control-component)** or for setting a variable.

:::info Actions
Check all the available Actions **[here](/docs/category/actions-reference)**.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/overview/events.png" alt="Components: Overview" />

</div>

## Bindings

Bindings allow you to get dynamic data into the components. Anything inside of **`{{}}`** is evaluated as a JavaScript expression in ToolJet.

Any arbitrary JavaScript code can be written inside **`{{}}`**:

```js
{{(function () {
        <your_javascript_code_here>
    })()
}}
```

or

```js
{{components.xyz.data.key === Sun ?? true : false}}
```

:::tip
Check out the How-to guides like **[changing color of text in table column](/docs/how-to/access-cellvalue-rowdata)**, **[Enable/Disable a component using JavaScript](/docs/how-to/access-currentuser)**, and **[more](/docs/category/how-to)**.
:::
