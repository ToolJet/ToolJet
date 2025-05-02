---
id: timer
title: Timer
---

# Timer

The **Timer** component allows users to track time by counting both upward and downward. It's useful for tasks like setting countdowns, tracking elapsed time, or timing events.

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div>                                                                                                                                                        |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                                  | It specifies the initial value of timer. Format is: `HH.MM.SS.MS`.                                                                                                                                       |
| Timer type                                     | It specifies if its a upward or downward counter. Select **Count Up** or **Count Down** from the dropdown or you can click on **fx** to programmatically define the values **countUp** or **countDown**. |

</div>

<div style={{paddingTop:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div>    |
| :------------------------------------------ | :--------------------------------------------------- |
| On start                                    | Triggers whenever the user clicks on start button.   |
| On resume                                   | Triggers whenever the user clicks on resume button.  |
| On pause                                    | Triggers whenever the user clicks on pause button.   |
| On count down finish                        | Triggers whenever the count down timer reaches zero. |
| On reset                                    | Triggers whenever the user clicks on reset button.   |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"100px"}}> Description </div>                                                                    | <div style={{ width:"135px"}}> How To Access </div>                         |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| value                                           | This variable holds the value of the timer in the following keys: **hour**, **minute**, **second**, and **mSecond**. | Access the value dynamically using JS: `{{components.timer1.value.second}}` |

</div>

<div style={{paddingTop:'24px'}}>

## General

### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Devices </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Expected Value </div>                                                                              |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                               | Makes the component visible in desktop view.      | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile                                | Makes the component visible in mobile view.       | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

<hr/>

<div style={{paddingTop:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div>             | <div style={{ width:"100px"}}> Configuration Options </div>                                                                  |
| :--------------------------------------------- | :------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Visibility                                     | Controls component visibility. Toggle or set dynamically.     | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable                                        | Enables or disables the component. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Box shadow                                     | Sets the box shadow properties of the component.              | Select the box shadow color and adjust the related properties or programmatically set it using **fx**.                       |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

</div>
