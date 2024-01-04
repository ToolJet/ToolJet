---
id: control-component
title: Control component
---

Control component action invokes the component specific actions. Component specific actions are the actions that are exclusive actions for a particular widget. Component specific actions can be triggered either through the event handlers or from the Run JavaScript code query.

:::info
Check out the **[live demo](https://youtu.be/JIhSH3YeM3E)** of Component specific actions demonstrated in one of our community call.
:::

## Available Component Specific Actions

| Widget | Component Specific Actions |
|--------|---------------------------|
| Button | Click, Set label, Disable, Visibility, Loading |
| Text   | Set text, Set Visibility |
| Text Input | Set text, Clear, Set Focus, Set Blur, Disable, Visibility |
| Text Area | Set text, Clear |
| Modal     | Show, Close |
| Table   | Set page, Select row, Deselect Row, Discard changes |
| Dropdown   | Select option |
| Multiselect   | Select option, Deselect option, Clear selection |
| Map   | Set location |
| Checkbox   | Set checked |
| Radio button | Select option |
| Tabs   | Set tab |
| Color picker   | Set color |
| File picker    | Clear files |

:::info
Currently, Component specific actions are supported only by the above listed widgets. We are working on bringing component specific actions for the remaining widgets.
:::

## Using Component Specific Actions

### Set a value for text input widget using button's event handler

- Drag a **Text Input** and a **Button** widget onto the canvas.

- Go to the **Inspector** on the left sidebar to check the exposed variables available for the `textinput1` widget under the `components`. You'll see that the variable `value` is an empty string because the field value of the text input widget is empty right now.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/inspector.png)

</div>

- Now enter some value in the text input widget and you'll see that the `value` in inspector has been updated.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/updated.png)

</div>

- Now, click on the button's widget handler to open up its properties in the right sidebar and then add a event handler for **On Click** event to trigger **Control Component** action. Select `textinput1` in component dropdown, `Set text` as Action, and in `Text` field enter the text that you want to update in the field value.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/button.png)

</div>

- Now when you'll click on the button you'll see that the field value of the text input widget has been updated with value that you set.

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference - Control Component](/img/actions/controlcomponent/set.png)

</div>


### Clear value of text input widget using JavaScript query

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

- Finally, hit the **save and run** query button to fire up the query, and you'll see that the field value of the text input widget has been cleared.

