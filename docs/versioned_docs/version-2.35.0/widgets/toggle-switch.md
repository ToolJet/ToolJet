---
id: toggle-switch
title: Toggle Switch
---
# Toggle Switch

The toggle switch widget allows the user to change a setting between two states.

The Toggle switch widget should be used if we want to make a binary choice, such as turning something **on or off** or **enable or disable**.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div>     | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- | 
| Label | This property can be used to set a label for the switch. Default Label: **Toggle label** |
| Default status | The property is used to set the default status (enabled or disabled) of the toggle switch component when the app is loaded. By default, the checkbox component is set to `{{false}}`/disabled. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event </div>     | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- | 
| On change | This event is triggered whenever the toggle switch is clicked. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables  </div>  | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> How To Access </div> |
|:----------- |:----------- |:------- |
| value | This variable holds the boolean value i.e `true` or `false` when the toggle is on or off respectively.| Access the value dynamically using JS: `{{components.toggleswitch1.value}}`|

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

|  <div style={{ width:"100px"}}> Layout </div> |  <div style={{ width:"100px"}}> Description </div> |  <div style={{ width:"100px"}}> Expected Value </div>|
|:----- |:---------  |:------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

|  <div style={{ width:"100px"}}> Style </div> |  <div style={{ width:"100px"}}> Description </div> |  <div style={{ width:"100px"}}> Default Value </div>|
|:----- |:---------  |:------------- |
| Text color | Change the color of the text in the widget by providig the `Hex color code` or choosing a color from the picker. |  |
| Toggle switch color | Change the color of the toggle switch in the widget by providig the `Hex color code` or choosing a color from the picker. |  |
| Visibility | This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. | By default, it's set to `{{true}}` |
| Disable | This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. | By default, its value is set to `{{false}}` |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>