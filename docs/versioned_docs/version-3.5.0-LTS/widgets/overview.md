---
id: overview
title: Overview
---

# Components: Overview

Components are used to build the user interface(UI) of the applications. They can be dragged onto the canvas from the **Component Library** and can be modified from the **Properties Panel** without needing to write any code. **[Event Handlers](/docs/widgets/overview#component-event-handlers)** in Components allow end users to trigger queries and other application events to perform the **[Actions](/docs/category/actions-reference)**.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Adding Components

Components can be dragged and dropped from the **Component Library**(from the right side on app builder) on to the canvas. You can reposition components by clicking and dragging them around the canvas. To resize a component, drag its edges or borders.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/overview/dragv2.gif" alt="Components: Overview" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Select Multiple Components

You can use **Shift+Click** to select and group multiple components together. Once grouped, the components can be moved around the canvas while maintaining their relative positions.

<div style={{textAlign: 'center', paddingBottom:'24px'}}>

<img className="screenshot-full" src="/img/widgets/overview/selectv2.gif" alt="Components: Overview" />

</div>

You can also create a selection rectangle to select and move multiple components together by clicking and dragging.

<div style={{textAlign: 'center', paddingBottom:'24px'}}>

<img className="screenshot-full" src="/img/widgets/overview/dragselv2.gif" alt="Components: Overview" />

</div>

:::tip
You can also use many other **[Keyboard Shortcuts](/docs/tutorial/keyboard-shortcuts)** in ToolJet to copy, cut, and paste components onto the canvas.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Component Properties

Components can be customized and styled using the **Properties Panel** such as the data field, a toggle for disabling the component, or styling like a background color. Properties can be modified directly or programmatically by using **[Bindings](/docs/widgets/overview/#bindings)**, which enables you to write JavaScript code.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Event Handlers

Event Handlers can be found in the Component's **Property Panel** or in the **Advanced** section of the Query. Event handlers can be used to trigger **[Actions](/docs/category/actions-reference)** such as executing the queries, performing Component Specific Actions(CSA) or for setting a variable.

Event handlers for components have the following properties:

1. **Event**: Each component has its own set of exclusive events. You can refer to the component reference to find the specific events available for each component. These events are triggered by user interactions or other actions within the application.

2. **Action**: Actions are the operations that can be performed when an event is triggered. There is a comprehensive list of available actions, which can be found in the **[actions reference documentation](/docs/category/actions-reference)**. In addition to general actions, each component may also have its own set of **Component Specific Actions (CSA)** that are specific to that particular component. The CSA can be found in the respective component reference.

3. **Run Only If**: This property allows you to define a condition that must be satisfied before the event handler's action is executed. By specifying a condition, you can control the flow of execution and ensure that the action is only performed when the condition is met. 

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/widgets/overview/isvalid.png" alt="Event Handler" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Using Run only if

With this option in Event Handlers, users can specify a condition that must be met before the event handler's action is executed. This allows for more fine-grained control over when certain actions should be triggered in response to component events.

For example, let's consider a button component with an `OnClick` event handler. By specifying a **Run Only If** condition for the event handler, users can control when the associated action should be executed. Here's an example:

```javascript
Button Component
  └─ OnClick Event Handler: runQuery()
                      │
                      ├─ Run Only If: expression/condition
```

In this case, the action `runQuery()` will only be triggered if the `expression/condition` evaluates to a true/truthy value. The `expression/condition` can utilize the values dynamically from other parts of the application or exposed variables.

**Example expressions:**

```js
{{globals.currentUser.groups[1] === 'admin'}} // returns true if the current user is admin

or

{{components.form1.isValid}} // isValid holds the boolean value true or false
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/overview/admin.png" alt="Components: Run only if" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Bindings

Bindings allow you to get dynamic data into the components. Anything inside of **`{{}}`** is evaluated as a JavaScript expression in ToolJet.

Any arbitrary JavaScript code can be written inside **`{{}}`**:

```js
{{(function () {
        <your_javascript_code_here>
    })()
}}

// or

{{components.xyz.data.key === Sun ?? true : false}}
```

:::tip
Check out the How-to guides like **[changing color of text in table column](/docs/how-to/access-cellvalue-rowdata)**, **[Enable/Disable a component using JavaScript](/docs/how-to/access-currentuser)**, and more.
:::

</div>