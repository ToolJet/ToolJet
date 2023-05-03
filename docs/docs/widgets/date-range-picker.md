---
id: date-range-picker
title: Date-range picker
---
# Date-range picker

The date-range picker widget allows users to select a range of dates.

## How To Use Date Range Picker Widget

<iframe height="500" src="https://www.youtube.com/embed/iBJQeh1kerE" title="Date range picker Widget" frameborder="0" allowfullscreen width="100%"></iframe>

## Properties

### Default start date

Set the start date to be selected by default in the widget

### Default end date

Set the start date to be selected by default in the widget

### Format

The format of the date selected by the date picker. Default date format is **DD/MM/YYYY**. Date format should be followed as ISO 8601 as mentioned in the [moment documentation](https://momentjs.com/docs/).

### General
#### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Date range picker" />

</div>

## Events

Date range picker supports the following events:

### On select

The On select event is triggered when the a start date and end date is selected on the picker. Just like any other event on ToolJet, you can set multiple handlers for on select event.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/date-range/event.png" alt="ToolJet - Widget Reference - Date range picker" />

</div>

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Border Radius

Use this property to modify the border radius of the date range picker. The field expects only numerical value from `1` to `100`, default is `0`. 
### Visibility

This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`.
### Disable

This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed variables

| Variables   | Description |
| ----------- | ----------- |
| endDate | This variable will hold the date of the endDate selected in the component. You can access the value dynamically using JS: `{{components.customcomponent1.data.title}}`|
| startDate | This variable will hold the value assigned inside the `code` for custom component. You can access the value dynamically using JS: `{{components.customcomponent1.data.title}}`|


## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.