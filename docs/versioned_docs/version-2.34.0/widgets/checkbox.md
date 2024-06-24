---
id: checkbox
title: Checkbox
---
# Checkbox

Checkbox widget can be used for allowing the users to make a binary choice, e.g,. unselected or selected.

:::info
The checkbox widget consists of a single checkbox input.
:::

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div>     | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| Label | The text is to be used as the label for the checkbox. This field expects a `String` input. |
| Default status | Sets the default status (enabled or disabled) of the checkbox widget when the app is loaded. By default, the checkbox component is set to `{{false}}`/disabled. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Events

To add an event to a checkbox component, click on the widget handle to open the widget properties on the right sidebar. Go to the **Events** section and click on **+ Add handler**.

| <div style={{ width:"100px"}}> Events </div>     | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On check | On check event is triggered when checkbox input is checked. |
| On uncheck | On uncheck event is triggered when checkbox input is unchecked. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

Following actions of checkbox component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Actions   </div>  | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:---------|
| setChecked | Changes the status of the checkbox component using component specific action from within any event handler.| Trigger it from the RunJS query: `await components.checkbox1.setChecked(true)` or `await components.checkbox1.setChecked(false)` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables  </div>    | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:----------|
| value | Holds the boolean value `true` if the checkbox is checked and `false` if unchecked.| Access the value dynamically using JS: `{{components.checkbox1.value}}`| 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

| <div style={{ width:"135px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| Show on desktop | Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on Fx to set the value `{{true}}` or `{{false}}` |
| Show on mobile | Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on Fx to set the value `{{true}}` or `{{false}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

|  <div style={{ width:"100px"}}> Style </div> |  <div style={{ width:"100px"}}> Description </div> |  <div style={{ width:"100px"}}> Default Value </div>|
|:----- |:---------  |:------------- |
| Text color | Change the color of the text in the widget by providig the `Hex color code` or choosing a color from the picker. |  |
| Checkbox color | Change the color of the toggle switch in the widget by providig the `Hex color code` or choosing a color from the picker. |  |
| Visibility | This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. | By default, it's set to `{{true}}`. |
| Disable | This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>