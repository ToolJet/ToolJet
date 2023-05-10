---
id: password-input
title: Password Input
---
# Password Input

A Password Input widget provides a way for the users to securely enter a password. The Password Input is a one-line plain text editor in which the text is obscured so that it cannot be read, by replacing each character with an asterisk ("*") symbol.

## How To Use Password Input Widget

<iframe height="500" src="https://www.youtube.com/embed/E9mfJ9cCJ0o" title="Password Input Widget" frameborder="0" allowfullscreen width="100%"></iframe>

## Properties

### Placeholder

It specifies a hint that describes the expected value. 

## Validation

### Regex

Use this field to enter a Regular Expression that will validate the password constraints.
### Min length

Enter the number for a minimum length of password allowed.

### Max length

Enter the number for the maximum length of password allowed.

### Custom validation

If the condition is true, the validation passes, otherwise return a string that should be displayed as the error message. For example: `{{components.passwordInput1.value === 'something' ? true: 'value should be something'}}`

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Password input" />

</div>

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Border radius

Add a border radius to the number input widget using this property. It accepts any numerical value from `0` to `100`.

### Border color

Add color to the border of the number input component using this property. Enter the hex color code or choose a color from the color picker.

### Background color

You can change the background color of the widget by entering the Hex color code or choosing a color of your choice from the color picker.

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::


## Exposed variables

| Variables    | Description |
| ----------- | ----------- |
| value | This variable holds the value entered by the user onto the password input component. You can access the value dynamically using JS: `{{components.passwordinput1.value}}`|

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.
