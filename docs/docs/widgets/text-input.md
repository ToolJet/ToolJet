---
id: text-input
title: Text Input
---
# Text Input

Text Input widget let users enter and edit text.

:::tip
The Text Input should be preferred when user input is a single line of text.
:::

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Text input](/img/widgets/text-input/textinput.png)

</div>

## Properties

### Default value

The default value that the widget will hold when the app is loaded.

### Placeholder

It specifies a hint that describes the expected value.

## Events

### On change
This event is fired whenever the user types something on the text input.

:::info
Check [Action Reference](/docs/actions/show-alert) docs to get the detailed information about all the **Actions**.
:::

## Validation

### Regex

Use this field to enter a Regular Expression that will validate the password constraints.

### Min length

Enter the number for a minimum length of password allowed.

### Max length

Enter the number for the maximum length of password allowed.

### Custom validation

If the condition is true, the validation passes, otherwise return a string that should be displayed as the error message. For example: `{{components.passwordInput1.value === 'something' ? true: 'value should be something'}}`.

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Border Radius

Use this property to modify the border radius of the widget. The field expects only numerical value from `1` to `100`, default is `0`. 
### Visibility

This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`.
### Disable

This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::