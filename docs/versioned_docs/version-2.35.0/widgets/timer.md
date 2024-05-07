---
id: timer
title: Timer
---
# Timer

The **Timer** widget lets users to count timer both upward and downward

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div>     | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- | 
| Default value | It specifies the initial value of timer. Format is: `HH.mm.ss.SS`. |
| Timer type | It specifies If its a upward or downward counter. Select `Count Up` or `Count Down` from the dropdown or you can click on `Fx` to programmatically define the values `countUp` or `countDown`. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event </div>     | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- | 
| On start | This event is fired when user clicks on start button. |
| On resume | This event is fired when user clicks on resume button. |
| On pause | This event is fired when user clicks on pause button. |
| On count down finish | This event is fired when the count down timer reaches zero. |
| On reset | This event is fired when user clicks on reset button. |

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

| <div style={{ width:"100px"}}> Variables </div>   | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:-------- |
| value | This variable holds the value of the timer in the following keys: **hour**, **minute**, **second**, and **mSecond**.| Access the value dynamically using JS: `{{components.timer1.value.second}}`|

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
| Visibility | This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. | By default, it's set to `{{true}}`. |
| Disable | This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>