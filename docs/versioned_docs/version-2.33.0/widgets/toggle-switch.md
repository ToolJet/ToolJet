---
id: toggle-switch
title: Toggle Switch
---
# Toggle Switch

The toggle switch widget allows the user to change a setting between two states.

The Toggle switch widget should be used if we want to make a binary choice, such as turning something **on or off** or **enable or disable**.

## How To Use Toggle Switch Widget

<iframe height="500" src="https://www.youtube.com/embed/NtP_9YC0hXs" title="Toggle Switch Widget" frameborder="0" allowfullscreen width="100%"></iframe>

## Properties

### Label

This property can be used to set a label for the switch. Default Label: **Toggle label**

### Default status

The property is used to set the default status (enabled or disabled) of the toggle switch component when the app is loaded. By default, the checkbox component is set to `{{false}}`/disabled.

## Event

### On change
This event is triggered whenever the toggle switch is clicked.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Toggle switch" />

</div>

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Text color

Change the color of the text in the widget by providig the `Hex color code` or choosing a color from the picker.

### Toggle switch color

Change the color of the toggle switch in the widget by providig the `Hex color code` or choosing a color from the picker.

### Visibility

This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`.

### Disable

This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed Variables

| Variables    | Description |
| ----------- | ----------- |
| value | This variable holds the boolean value i.e `true` or `false` when the toggle is on or off respectively. You can access the value dynamically using JS: `{{components.toggleswitch1.value}}`|

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.
