---
id: checkbox
title: Checkbox
---
# Checkbox

Checkbox component can be used for allowing the users to make a binary choice, e.g,. unselected or selected.

:::info
The checkbox component consists of a single checkbox input.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/checkbox/checkbox.png" alt="ToolJet - Component Reference - Checkbox" />

</div>

<iframe height="500" src="https://www.youtube.com/embed/Ryu2k2bqkWw" title="Checkbox Component" frameborder="0" allowfullscreen width="100%"></iframe>

## Properties

### Label

The text is to be used as the label for the checkbox. This field expects a `String` input.

### Default Status

The property is used to set the default status (enabled or disabled) of the checkbox component when the app is loaded. By default, the checkbox component is set as `{{false}}`, indicating it is disabled.

## Events

To attach an event to a checkbox component, click on the component handle to access the component properties located in the right sidebar. Navigate to the **Events** section and then select **+ Add handler**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/checkbox/events.png" alt="ToolJet - Component Reference - Checkbox" />

</div>

### On check

The "On check" event is activated when the checkbox input is selected.

### On uncheck

The "On uncheck" event is activated when the checkbox input is deselected.

:::info
For comprehensive details about all available **Actions**, refer to the [Action Reference](/docs/category/actions-reference) documentation.
:::

## General
#### Tooltip

A Tooltip is often used to specify the extra information when the user hovers the mouse pointer over the component. Once a value is set for Tooltip, hovering over the element will display the specified string as the tooltip text.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/checkbox/tooltip.png" alt="ToolJet - Component Reference - Checkbox" width='300'/>

</div>

## Layout

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/checkbox/layout1.png" alt="ToolJet - Component Reference - Checkbox" width='300'/>

</div>

| Property      | Description |
| ----------- | ----------- |
| Show on desktop | Toggle on or off to display the component in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`. |
| Show on mobile | Toggle on or off to display the component in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`. |

## Styles

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/checkbox/styles1.png" alt="ToolJet - Component Reference - Checkbox" width='300'/>

</div>

| Property      | Description |
| ----------- | ----------- |
| Text color | Change the color of the Text in checkbox by entering the `Hex color code` or choosing a color of your choice from the color-picker. |
| Checkbox color | You can change the color of the checkbox by entering the `Hex color code` or choosing a color of your choice from the color-picker. |
| Visibility | Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the component will not be visible after the app is deployed. By default, it's set to `{{true}}`. |
| Disable | This is `off` by default, toggle `on` the switch to lock the component and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the component will be locked and becomes non-functional. By default, its value is set to `{{false}}`. |
| Box shadow | You can add a shadow effect to the component by toggling on the switch. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the component will have a shadow effect. By default, its value is set to `{{false}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed Variables

| Variables      | Description |
| ----------- | ----------- |
| value | This variable holds the boolean value `true` if the checkbox is checked and `false` if unchecked. You can access the value dynamically using JS: `{{components.checkbox1.value}}`| 

## Component specific actions (CSA)

Following actions of checkbox component can be controlled using the component specific actions(CSA):

| Actions     | Description |
| ----------- | ----------- |
| setChecked | You can change the status of the checkbox component using component specific action from within any event handler. Additionally, you have the option to trigger it from the RunJS query: `await components.checkbox1.setChecked(true)` or `await components.checkbox1.setChecked(false)` |