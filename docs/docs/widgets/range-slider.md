---
id: range-slider
title: Range Slider
---
# Range Slider

The **Range Slider** component is widely used across different UIs. One of the main purposes is to filter, explore all the related content and available in the control and settings options.

:::tip
Range Sliders have **Two handles** option which allows users to select a range.
:::

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | 
|:------------ |:-------------|
| Minimum value | Set the minimum value for the slider. This field accepts any numerical value. |
| Maximum value | Set the maximum value for the slider. This field accepts any numerical value. |
| Value | Set the default value when the component loads. This can be used to pre-fill the value based on your data and requirements. |
| Two handles | The slider will now have 2 dragging handles. It is used to define a range of values versus a single given value. |

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables  </div>  | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:--------- |
| value | Holds an object when `two handles` option is disabled or an array when `two handles` is enabled from the component properties. | The value can be accessed dynamically using JS: `{{components.rangeslider1.value}}` or `{{components.rangeslider1.value[1]}}` |

</div>

<div style={{paddingTop:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view.| You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile  | Makes the component visible in mobile view.  | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

<div style={{paddingTop:'24px'}}>

---

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}>  Description </div> | 
|:------------ |:-------------|
| Line color | Enter the hex code to set the default color for the slider's track. |
| Handle color | Enter the hex code to set the color for the slider's handler. |
| Track color | Enter the hex code to set the color for the slider's active portion on the track. |
| Visibility | Set the visibility of the slider programmatically. The default value is `{{true}}`. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

</div>
