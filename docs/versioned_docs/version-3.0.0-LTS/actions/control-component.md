---
id: control-component
title: Control component (Component Specific Actions)
---

Control component action invokes the component specific actions. Component specific actions are the actions that are exclusive actions for a particular component. Component specific actions can be triggered either through the event handlers or from the Run JavaScript code query.

You can find the component specific actions for the specific component in their respective documentation. For example, you can find the component specific actions for the **Bounded Box** component in the [Bounded Box](/docs/widgets/bounded-box) documentation.

<details>
  <summary>Currently, Component specific actions are supported only by the below listed components.</summary>
  <div>
    <ul>
    <li><a href="/docs/widgets/button#component-specific-actions-csa">Button</a></li>
    <li><a href="/docs/widgets/checkbox#component-specific-actions-csa">Checkbox</a></li>
    <li><a href="/docs/widgets/color-picker#component-specific-actions-csa">Color Picker</a></li>
    <li><a href="/docs/widgets/dropdown#component-specific-actions-csa">Dropdown</a></li>
    <li><a href="/docs/widgets/file-picker#component-specific-actions-csa">File Picker</a></li>
    <li><a href="/docs/widgets/form#component-specific-actions-csa">Form</a></li>
    <li><a href="/docs/widgets/icon#component-specific-actions-csa">Icon</a></li>
    <li><a href="/docs/widgets/kanban#component-specific-actions-csa">Kanban</a></li>
    <li><a href="/docs/widgets/link#component-specific-actions-csa">Link</a></li>
    <li><a href="/docs/widgets/map#component-specific-actions-csa">Map</a></li>
    <li><a href="/docs/widgets/modal#component-specific-actions-csa">Modal</a></li>
    <li><a href="/docs/widgets/multiselect#component-specific-actions-csa">Multiselect</a></li>
    <li><a href="/docs/widgets/radio-button#component-specific-actions-csa">Radio button</a></li>
    <li><a href="/docs/widgets/table#component-specific-actions-csa">Table</a></li>
    <li><a href="/docs/widgets/tabs#component-specific-actions-csa">Tabs</a></li>
    <li><a href="/docs/widgets/text-input#component-specific-actions-csa">Text Input</a></li>
    <li><a href="/docs/widgets/text#component-specific-actions-csa">Text</a></li>
    <li><a href="/docs/widgets/textarea#component-specific-actions-csa">Text Area</a></li>
    </ul>
  </div>
</details>

:::info
Check out the **[demo](https://youtu.be/JIhSH3YeM3E)** of Component specific actions demonstrated in one of our community call.
:::

## Using Component Specific Actions

### Set a value for text input component using button's event handler

- Drag a **Text Input** and a **Button** component onto the canvas.

- Go to the **Inspector** on the left sidebar to check the exposed variables available for the `textinput1` component under the `components`. You'll see that the variable `value` is an empty string because the field value of the text input component is empty right now.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/inspector.png)

</div>

- Now enter some value in the text input component and you'll see that the `value` in inspector has been updated.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/updated.png)

</div>

- Now, click on the button's component handler to open up its properties in the right sidebar and then add a event handler for **On Click** event to trigger **Control Component** action. Select `textinput1` in component dropdown, `Set text` as Action, and in `Text` field enter the text that you want to update in the field value.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/button.png)

</div>

- Now when you'll click on the button you'll see that the field value of the text input component has been updated with value that you set.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/set.png)

</div>


### Clear value of text input component using JavaScript query

- Let's clear the value that we set in the previous section, using Run JavaScript code. Create a new Run JavaScript Code query and call the component and the CSA that component provides.

**Syntax:**
```js
await components.textinput1.clear()
```

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/jsoption.png)

</div>


<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/clear.png)

</div>

- Finally, hit the **save and run** query button to fire up the query, and you'll see that the field value of the text input component has been cleared.

