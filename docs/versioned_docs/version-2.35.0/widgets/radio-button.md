---
id: radio-button
title: Radio Button
---
# Radio Button

Radio button widget can be used to select one option from a group of options.

:::tip
Radio buttons are preferred when the list of options is less than six, and all the options can be displayed at once.
:::

:::info
For more than six options, consider using **[Dropdown](/docs/widgets/dropdown)** widget.
:::

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | 
|:------------ |:-------------|
| Label | The text is to be used as the label for the radio button. This field expects a `String` value. |
| Default value | The value of the default option. |
| Option values | List of values for different items/options. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.value)}}` or populate it with sample values `{{[true, false]}}`. |
| Option labels | List of labels for different items/options. Refer your query data with dynamic variables `{{queries.datasource.data.map(item => item.label)}}` or populate it with sample values `{{["yes", "no"]}}`. |

## Event

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:------------------|:---------------------|
| On select | This event is triggered when an option is clicked. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

Following actions of color picker component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Actions  </div> |<div style={{ width:"135px"}}>  Description </div> | <div style={{ width:"135px"}}> How To Access </div>
|:----------- |:----------- |:------- |
| selectOption | Select an option from the radio buttons via a component-specific action within any event handler. | Employ a RunJS query to execute component-specific actions such as: `await components.radiobutton1.selectOption('one')` |

## Exposed Variables

There are currently no exposed variables for the component.

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}>  Description </div> | <div style={{ width:"100px"}}> Default Value </div> |
|:------------ |:-------------|:--------- |
| Text color | Change the color of the text in the widget by providing the `Hex color code` or by choosing the color of your choice from the color picker. |  |
| Active color | Change the color of active radio button by providing the `Hex color code` or by choosing the color of your choice from the color picker. |  |
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. | By default, it's set to `{{true}}` |
| Disable | This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. | By default, its value is set to `{{false}}` |