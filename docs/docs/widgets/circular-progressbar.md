---
id: circular-progress-bar
title: Circular Progress Bar
---
# Circular Progress Bar

Circular progress bar widget can be used to show progress in a progress circle.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/circular-progressbar/cpb.png" alt="ToolJet - Widget Reference - Circular progress bar" />

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

| <div style={{ width:"100px"}}> Properties </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| ----------- | ----------- | --------------- |
| Text | Sets a text inside the progress circle.| It expects a `String`, you can also use js to dynamically update the text as the progress changes. |
| Progress | Sets the progress of the widget. | Progress should be an integer between 0 and 100.|

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

There are currently no exposed variables for the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> |
| ----------- | ----------- |
| Show on desktop | Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on Fx to set the value `{{true}}` or `{{false}}`. |
| Show on mobile | Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on Fx to set the value `{{true}}` or `{{false}}`. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| ----------- | ----------- | ------------------- |
| Color | Defines stroke color.| `HEX color code` or choose color from color-picker. |
| Text color | Defines color of the text inside circular progress bar.| `HEX color code` or choose color from color-picker |
| Text size | Defines the size of the text | Value must between 0-100 |
| Stroke width | Defines the width of stroke | Value must between 0-100|
| Counter clockwise | Whether to rotate progress bar in counterclockwise direction. | Accepts `{{true}}` and `{{false}}`, Default value is `false`|
| Circle ratio | Defines ratio of the full circle diameter the progressbar should use. | Accepts numerical value and the default is `1` |
| Visibility | Toggle on or off to control the visibility of the widget. | Programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}` |

:::info
Circular progress bar widget uses [react-circular-progress](https://github.com/kevinsqi/react-circular-progressbar) package. Check the repo for further more details about properties and styles.
:::

</div>