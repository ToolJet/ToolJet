---
id: circular-progress-bar
title: Circular Progress Bar
---
# Circular Progress Bar

Circular progress bar component can be used to show progress in a progress circle. It can be used to show progress of a task or percentage of a goal achieved.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/circular-progressbar/cpb1.png" alt="ToolJet - Component Reference - Circular progress bar" />

</div>

## Properties

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/circular-progressbar/prop1.png" alt="ToolJet - Component Reference - Circular progress bar" width='300'/>

</div>

| properties  | description | Expected Value |
| ----------- | ----------- | --------------- |
| Text | We can set a text inside the progress circle.| It expects a `String`, you can also use js to dynamically update the text as the progress changes. |
| Progress | It can be used to set the progress of the component. | Progress should be an integer between 0 and 100.|

## General
#### Tooltip

A Tooltip is often used to specify the extra information when the user hovers the mouse pointer over the component. Once a value is set for Tooltip, hovering over the element will display the specified string as the tooltip text.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/circular-progressbar/tooltip.png" alt="ToolJet - Component Reference - Circular progress bar" width='300'/>

</div>

## Layout

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/circular-progressbar/layout1.png" alt="ToolJet - Component Reference - Circular progress bar" width='300'/>

</div>

| Layout  | description |
| ----------- | ----------- |
| Show on desktop | Toggle on or off to display the component in desktop view. You can programmatically determine the value by clicking on Fx to set the value `{{true}}` or `{{false}}`. |
| Show on mobile | Toggle on or off to display the component in mobile view. You can programmatically determine the value by clicking on Fx to set the value `{{true}}` or `{{false}}`. |

## Styles

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/circular-progressbar/styles1.png" alt="ToolJet - Component Reference - Circular progress bar" width='300'/>

</div>

| properties      | description | Expected Value |
| ----------- | ----------- | ------------------- |
| Color | To define stroke color.| `HEX color code` or choose color from color-picker. |
| Text color | To define color of the text inside circular progress bar.| `HEX color code` or choose color from color-picker. |
| Text size | To define the size of the text | Value must between 0-100. |
| Stroke width | To define the width of stroke | Value must between 0-100.|
| Counter Clockwise | Whether to rotate progress bar in counterclockwise direction. | It accepts `{{true}}` and `{{false}}`, Default value is `false`.|
| Circle ratio | To define ratio of the full circle diameter the progressbar should use. | It accepts numerical value and the default is `1`. |
| Visibility | Toggle on or off to control the visibility of the component. | You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the component will not be visible after the app is deployed. By default, it's set to `{{true}}`. |

:::info
Circular progress bar component uses [react-circular-progress](https://github.com/kevinsqi/react-circular-progressbar) package. Check the repo for further more details about properties and styles.
:::


## Exposed variables

There are currently no exposed variables for the component.

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.
