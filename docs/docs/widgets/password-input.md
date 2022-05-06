---
id: password-input
title: Password Input
---
# Password Input

A Password Input widget provides a way for the users to securely enter a password. The Password Input is a one-line plain text editor in which the text is obscured so that it cannot be read, by replacing each character with an asterisk ("*") symbol.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Password Input](/img/widgets/password-input/password-input.gif)

</div>

## Properties

### Placeholder

It specifies a hint that describes the expected value. 

## Validation

### Regex

Use this field to enter a Regular Expression that will validate the password constraints. |
### Min length

Enter the number for a minimum length of password allowed.

### Max length

Enter the number for the maximum length of password allowed.

### Custom validation

If the condition is true, the validation passes, otherwise return a string that should be displayed as the error message. For example: `{{components.passwordInput1.value === 'something' ? true: 'value should be something'}}`

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Border radius

Add a border radius to the number input widget using this property. It accepts any numerical value from `0` to `100`.

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::