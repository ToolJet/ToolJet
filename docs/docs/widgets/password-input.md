---
id: password-input
title: Password Input
---
# Password Input

The Password Input component allows users to enter passwords securely. In this component, passwords are concealed, displaying each character as an asterisk to ensure privacy. In this document, we'll go through all the configuration options for the **Password Input** component. 


## How To Use Password Input Component

<iframe height="500" src="https://www.youtube.com/embed/E9mfJ9cCJ0o" title="Password Input Component" frameborder="0" allowfullscreen width="100%"></iframe>

## Properties

| Property          | Description       | Expected Value    |
|:------------------|:------------------|:----------------------------------------------------|
| Placeholder       | Provides a hint for the expected value. It disappears once the user interacts with the component.| Enter some instructional text as the value (example: "Type name here")  |
| Regex             | Use this field to enter a Regular Expression that will validate the password constraints.| Regular Expression    |
| Min length        | Enter the number for a minimum length of password allowed.| Numeric value  |
| Max length        | Enter the number for the maximum length of password allowed.| Numeric value |
| Custom validation | If the condition is true, the validation passes, otherwise return a string that should be displayed as the error message.  | A validation condition (example: `{{components.passwordInput1.value === 'something' ? true : 'value should be something'}}` )|

## General
### Tooltip

A **Tooltip** is commonly used to provide additional information about an element. This information becomes visible when the user hovers the mouse pointer over the respective component.

In the input field under **Tooltip**, you can enter some text and the component will show the specified text as a tooltip when it is hovered over. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Component Reference - Password input" />

</div>

## Layout

<font size="4"><b>Show on desktop</b></font>

Use this toggle to show or hide the component in the desktop view. You can dynamically configure the value by clicking on `Fx` and entering a logical expression that results in either true or false. Alternatively, you can directly set the values to `{{true}}` or `{{false}}`.

<font size="4"><b>Show on mobile</b></font>

Use this toggle to show or hide the component in the mobile view. You can dynamically configure the value by clicking on `Fx` and entering a logical expression that results in either true or false. Alternatively, you can directly set the values to `{{true}}` or `{{false}}`. 

---

## Styles

| Style| Description  | Expected Value |
|:-------------------|:-------------------------------|:-------------------------------|
| Visibility | Controls the visibility of the component. If set to `{{false}}`, the component will not be visible after the app is deployed.| Use the toggle button or dynamically configure the value by clicking on `Fx` and entering a logical expression that results in either `{{true}}` or `{{false}}`.|
| Disable | Makes the component non-functional when set to true. | Use the toggle button or dynamically configure the value by clicking on `Fx` and entering a logical expression that results in either `{{true}}` or `{{false}}`.|
| Border radius | Adjusts the roundness of the component's corners.  | Numeric value|
| Background color    | Changes the background color of the component. | Hex color code/choose a color using the color picker |

## General

<font size="4"><b>Box Shadow</b></font>

The **Box Shadow** property is used to add shadow effects around a component's frame. You can specify the horizontal and vertical offsets(through X and Y sliders), blur and spread radius, and color of the shadow.

## Exposed Variables

| Variables    | Description |
| :----------- |:----------- |
| value | This variable holds the value entered by the user onto the password input component. You can access the value dynamically using JS: `{{components.passwordinput1.value}}`|

## Component Specific Actions (CSA)

There are currently no Component-Specific Actions (CSA) implemented to regulate or control the component.
