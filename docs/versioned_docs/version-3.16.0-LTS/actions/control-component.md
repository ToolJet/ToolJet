---
id: control-component
title: Control component (Component Specific Actions)
---

The **Control Component** action invokes a Component-Specific Action (CSA) — an exclusive action exposed by a particular component, such as setting a Text Input's value or clearing it. CSAs can be triggered either through event handlers or from a RunJS query.

You can find the list of CSAs available for a specific component in that component's own documentation. For example, the CSAs for the **Bounded Box** component are listed in the [Bounded Box](/docs/widgets/bounded-box) documentation.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| Component | The target component whose CSA you want to invoke | — |
| Action | The CSA to invoke on the selected component (e.g. `Set text`, `Clear`) | — |
| Action-specific fields | Additional fields depend on the CSA selected (e.g. the `Text` field for `Set text`) | — |
| Debounce | Time in milliseconds to wait before executing the action | Empty (no delay) |

:::info
Check out the **[demo](https://youtu.be/JIhSH3YeM3E)** of Component Specific Actions demonstrated in one of our community calls.
:::

## Example

### Set a value for a text input component using a button's event handler

- Drag a **Text Input** and a **Button** component onto the canvas.
- Go to the **Inspector** on the left sidebar to check the exposed variables available for the `textinput1` component under `components`. The `value` is an empty string because the field is empty right now.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/inspector.png)

</div>

- Enter some value in the text input component and you'll see that `value` in the Inspector has been updated.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/updated.png)

</div>

- Now click on the button component to open its properties in the right sidebar, then add an event handler for **On Click** to trigger the **Control Component** action. Select `textinput1` in the component dropdown, `Set text` as the action, and enter the text you want to update the field with in the `Text` field.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/button.png)

</div>

- When you click the button, the text input's value updates to the value you set.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/set.png)

</div>

### Clear the value of a text input component using RunJS

Let's clear the value we set above using a RunJS query. Create a new Run JavaScript Code query and call the component and the CSA that component provides.

```js
await components.textinput1.clear()
```

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/jsoption.png)

</div>

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/clear.png)

</div>

Hit **Save and run** to fire the query, and you'll see that the text input's field value has been cleared.

## Triggering via RunJS

CSAs are invoked directly on the target component, using the CSA's own method name — not through a generic `actions.controlComponent()` call:

```js
await components.<componentName>.<csaMethod>(<params>);
// e.g. await components.textinput1.setText('hello');
```

The available CSA methods depend on the component — refer to that component's documentation for its full list.

:::info
For a full quick-reference of all actions' RunJS syntax, see [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
