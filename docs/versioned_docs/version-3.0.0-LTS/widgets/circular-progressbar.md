---
id: circular-progress-bar
title: Circular Progressbar
---
# Circular Progressbar

The Circular Progressbar component can be used to show progress in a progress circle.

<div style={{paddingTop:'24px'}}>

## Properties

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

| <div style={{ width:"100px"}}> Properties </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| ----------- | ----------- | --------------- |
| Text | Sets a text inside the progress circle.| It expects a `String`, you can also use js to dynamically update the text as the progress changes. |
| Progress | Sets the progress of the component. | Progress should be an integer between 0 and 100.|

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

There are currently no exposed variables for the component.

</div>

<div style={{paddingTop:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Expected Value </div> |
| ----------- | ----------- | ----------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

<div style={{paddingTop:'24px'}}>

---

## Styles

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| ----------- | ----------- | ------------------- |
| Color | Defines stroke color.| `HEX color code` or choose color from color-picker. |
| Text color | Defines color of the text inside circular progress bar.| `HEX color code` or choose color from color-picker |
| Text size | Defines the size of the text | Value must between 0-100 |
| Stroke width | Defines the width of stroke | Value must between 0-100|
| Counter clockwise | Whether to rotate progress bar in counterclockwise direction. | Accepts `{{true}}` and `{{false}}`, Default value is `false`|
| Circle ratio | Defines ratio of the full circle diameter the progressbar should use. | Accepts numerical value and the default is `1` |
| Visibility | Toggle on or off to control the visibility of the component. | Programmatically change its value by clicking on the **fx** button next to it. If `{{false}}` the component will not be visible after the app is deployed. By default, it's set to `{{true}}` |

:::info
Circular progress bar component uses [react-circular-progress](https://github.com/kevinsqi/react-circular-progressbar) package. Check the repo for further more details about properties and styles.
:::

</div>
