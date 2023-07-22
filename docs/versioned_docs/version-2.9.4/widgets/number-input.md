---
id: number-input
title: Number Input
---
# Number Input

The Number Input component allows users to input and modify numerical values.

:::info
Numbers can be adjusted using the arrow keys.
:::

## Properties

### Default Value

Specify a default value for the number input component when the application is loaded. A default value is a pre-established value that can be retrieved from the number input widget if no modifications are made to it.

Example values:

```js
10 // integer type
3.54 // decimal type
10.00 // decimal type, but displayed as 10 on the number input component
```

### Minimum value

This field sets the minimum value that can be entered in the number input. Any numerical value is accepted.

### Maximum value

This field sets the maximum value that can be entered in the number input. Any numerical value is accepted.

### Placeholder

The placeholder value is displayed when no user input has been made yet. It disappears once the user interacts with the control, such as typing a number or using the arrow keys on the right side of the component. Any numerical value can be used as a placeholder.

### Loading state

The loading state can be enabled to show a spinner as the content of the number input. This is commonly used with the `isLoading` property of queries to indicate a loading status while a query is being executed. You can toggle the state to "On" or use the "fx" option to programmatically set the value to `{{true}}` or `{{false}}`.

### Decimal places

This property determines the number of decimal places displayed in the number input component. It allows you to specify the level of precision for decimal values.

For example, if you set the decimal places to **{{2}}**, any decimal value entered or displayed in the number input will be rounded to two decimal places. This ensures consistent formatting and helps users input and visualize decimal values accurately. It can be set to **{{0}}** for whole numbers or increased to display more precise decimal values.

## Events

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/number-input/event.png" alt="Events-Number Input" />

</div>

### On change
This event fires whenever the value of the number input widget is changed.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget. Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="Events-Number Input" />

</div>

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

### Border radius

Add a border radius to the number input widget using this property. It accepts any numerical value from `0` to `100`.

### Border color

Change the border color number-input component by entering the Hex color code or choosing a color of your choice from the color picker.

### Background color

Change the background color of the number-input component by entering the Hex color code or choosing a color of your choice from the color picker.

### Text color

Change the color of the number in number-input component by entering the Hex color code or choosing a color of your choice from the color picker. 

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed variables

| Variables    | Description |
| ----------- | ----------- |
| value | This variable updates whenever a user selects a number on the number input. You can access the value dynamically using JS: `{{components.numberinput1.value}}`|

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.