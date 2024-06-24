---
id: multiselect
title: Multiselect
---
# Multiselect

Multiselect widget can be used to collect multiple user inputs from a list of options.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property   </div>   | <div style={{ width:"100px"}}> Description </div> | 
|:----------- |:----------- |
| Label | The text is to be used as the label for the multiselect widget. |
| Default value | The value of the default option. This should always be an array. |
| Option values | Values for different items/options in the list of the multiselect. |
| Option labels | Labels for different items/options in the list of the multiselect. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Events

| <div style={{ width:"135px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------------- | :--------------------------------------------- |
| On select | The **On select** event is triggered when a particular option is chosen. |
| On search text changed | This event is triggered when a user modifies the search text on the multiselect component. This event also updates the value of the `searchText` **[exposed variable](#exposed-variables)**. |

:::info
For comprehensive information on all available **Actions**, refer to the [Action Reference](/docs/category/actions-reference) documentation.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)
`await components.multiselect1.clearSelections()` <br/>
`await components.multiselect1.deselectOption(2)`

Following actions of multselect component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:-------- |
| selectOption | Select an option on the multiselect component via a component-specific action within any event handler.| Employ a RunJS query to execute component-specific actions such as `await components.multiselect1.selectOption(3)` |
| deselectOption | Deselect a selected option on the multiselect component via a component-specific action within any event handler. | Employ a RunJS query to execute component-specific actions such as `await components.multiselect1.deselectOption(3)` | 
| clearOptions | Clear all the selected options from the multiselect component via a component-specific action within any event handler. |Employ a RunJS query to execute component-specific actions such as `await components.multiselect1.clearSelections(2,3)` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables  </div>  | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:----------|
| values | This variable holds the values of the multiselect component in an array of objects where the objects are the options in the multiselect.| Access the value dynamically using JS: `{{components.multiselect1.values[1]}}` |
| searchText | This variable stores the user-entered search text in the multiselect component. | The value of this variable is updated with each character entered in the search field |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style   </div>   | <div style={{ width:"100px"}}> Description </div> | 
|:----------- |:----------- |
| Border radius | Add a border radius to the multiselect using this property. It accepts any numerical value from `0` to `100`. |
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`. |
| Disable | This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Actions

| <div style={{ width:"100px"}}> Action   </div>   | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Properties </div> |
|:----------- |:----------- |:------------------ |
| `selectOption` | Select options. | pass options as parameter. ex: `components.multiselect1.selectOption(1)` |
| `deselectOption` | Deselect options.| pass options as parameter. ex: `components.multiselect1.deselectOption(1)` |
| `clearSelections` | Clear all selection. |  ex: `components.multiselect1.clearSelections()` |


:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>