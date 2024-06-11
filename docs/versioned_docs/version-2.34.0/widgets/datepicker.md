---
id: datepicker
title: Datepicker
---
# Datepicker

The Datepicker widget allows users to select a single value for date and time from a pre-determined set.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property  </div>    | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| Default value | This value acts as placeholder for the date picker widget, if any value is not provided then the default value will be used from the picker. The default value needs to be a `String` with respect to the `format` field. Ex: If format is set to `MM/YYYY` then provide default value as `04/2022` |
| Format | This value acts as placeholder for the date picker widget, if any value is not provided then the default value will be used from the picker. The default value needs to be a `String` with respect to the `format` field. Ex: If format is set to `MM/YYYY` then provide default value as `04/2022` |
| Enable time selection? | Toggle on or off to enable the time selection. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Enable date selection? | Toggle on or off to enable the date selection. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Disabled dates | We can give disabled dates property which will make specific dates disabled and cannot be selected. The default value needs to be an array of`Strings` |

Example for disabling the 9th of January:
```js
{{['09-01']}}
```

Now user won't be able to select the mentioned date since it will be disabled. 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Events

To add an event to a date-picker component, click on the widget handle to open the widget properties on the right sidebar. Go to the **Events** section and click on **+ Add handler**.

| <div style={{ width:"100px"}}> Event  </div>    | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On select | On select event is triggered when an date is selected |

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

| <div style={{ width:"100px"}}> Variables </div>  | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- | :---------- |
| value | This variable holds the date selected on the component, the date value will be returned according to the format set in the datepicker properties. | Access the value dynamically using JS: `{{components.datepicker1.value}}`|

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Validation

### Custom Validation

Add a validation for the date input in the widget using the ternary operator.

Example of validation for selecting dates that are after the current date:
```js
{{moment(components.datepicker1.value, 'DD/MM/YYYY').isAfter(moment()) ? true : 'Date should be after today'}}
```

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

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Default Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Visibility | This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}` | By default, it's set to `{{true}}` |
| Disable | This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional | By default, its value is set to `{{false}}` |
| Border radius | Use this property to modify the border radius of the date-picker. The field expects only numerical value from `1` to `100` | By default, its value is set to `0` |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>