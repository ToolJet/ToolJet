---
id: toggle-switch
title: Toggle Switch
---
# Toggle Switch

The toggle switch widget allows the user to change a setting between two states.

The Toggle switch widget should be used if we want to make a binary choice, such as turning something **on or off** or **enable or disable**.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Timer](/img/widgets/toggle-switch/toggleswitch.png)

</div>

## Property

### Label

This property can be used to set a label for the switch. Default Label: **Toggle label**

## Event

### On change
This event is triggered whenever the toggle switch is clicked.

:::info
Check [Action Reference](/docs/actions/show-alert) docs to get the detailed information about all the **Actions**.
:::

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

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