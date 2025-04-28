---
id: radio-button
title: Radio Button
---

The **Radio button** component can be used to collect user input from a list of options.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div>  |
| :------ |:-------------|
| Label  | The text is to be used as the label for the radio button. This field expects a `String` value.   |
| Default value  | The value of the default option.   |
| Option values | List of values for different items/options. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.value)}}` or populate it with sample values `{{[true, false]}}`. |
| Option labels    | List of labels for different items/options. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.label)}}` or populate it with sample values `{{["yes", "no"]}}`. |

## Component specific actions (CSA)

Following actions of the component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| selectOption()        | Selects an option.      | Employ a RunJS query (for e.g.,  <br/> `await components.radiobutton1.selectOption(2)`) or trigger it using an event. |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:----------|:----------|:------------|
| value  | Holds the value selected by the user in the component.  | Accessible dynamically with JS (for e.g., `{{components.radiobutton1.value}}`). |

## Events

| <div style={{ width:"135px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------------- | :--------------------------------------------- |
| On select | The **On select** event is triggered when a particular option is chosen. |

:::info
For comprehensive information on all available **Actions**, refer to the [Action Reference](/docs/category/actions-reference) documentation.
:::

## General

### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

---

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Default Value </div> |
| :--------- | :--------------- | :-------------- |
| Text color | Change the color of the text in the component by providing the `Hex color code` or by choosing the color of your choice from the color picker. |   |
| Active color  | Change the color of active radio button by providing the `Hex color code` or by choosing the color of your choice from the color picker.   |   |
| Visibility   | Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the **fx** button next to it. If `{{false}}` the component will not be visible after the app is deployed.  | By default, it's set to `{{true}}` |
| Disable  | This is `off` by default, toggle `on` the switch to lock the component and make it non-functional. You can also programmatically set the value by clicking on the **fx** button next to it. If set to `{{true}}`, the component will be locked and becomes non-functional. | By default, its value is set to `{{false}}`         |
