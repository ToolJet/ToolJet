---
id: datepicker-v2
title: Date Picker
---
# Date Picker

The **Date Picker** is a component for selecting dates without time input, reducing complexity for developers. It offers customizable formats, validation, and styling.

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the field.           | String (e.g., `Date`).         |
| Default value | The default value that the component will hold when the app is loaded. | String (e.g., `01/01/2022`). |
| Format | The format of the date selected by the date picker. Default date format is **DD/MM/YYYY**. Date format should be followed as ISO 8601 as mentioned in the [moment documentation](https://momentjs.com/docs/). | |

</div>

<div style={{paddingTop:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event  </div>    | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On select | Triggers whenever a start date or end date is selected in the date range picker component. |
| On focus     | Triggers whenever the user clicks inside the input field.                                        |
| On blur      | Triggers whenever the user clicks outside the input field.                                       |

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

Following actions of component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:----------- |:----------- | :------------ |
| clearValue()| Clears both the date and time values.| Employ a RunJS query (for e.g.,  <br/> `await components.datepicker1.clearValue(1)`) or trigger it using an event.|
| setValue()|Sets both the date and time values.| Employ a RunJS query (e.g.,  <br/> `await components.datepicker1.setValue(dateTime)`) or trigger it using an event.|
| setDate()|Sets the date value.| Employ a RunJS query (e.g.,  <br/> `await components.datepicker1.setDate(date)`) or trigger it using an event.|
| setDisabledDates()| Disables specific dates, preventing selection.| Employ a RunJS query (e.g.,  <br/> `await components.datepicker1.setDisabledDates([date1, date2])`) or trigger it using an event.|
| clearDisabledDates()| Clears all disabled date restrictions.|Employ a RunJS query (e.g.,  <br/> `await components.datepicker1.clearDisabledDates()`) or trigger it using an event.|
| setMinDate()| Updates the minimum selectable date.| Employ a RunJS query (e.g.,  <br/> `await components.datepicker1.setMinDate(date)`) or trigger it using an event. |
| setMaxDate()| Updates the maximum selectable date.   |Employ a RunJS query (e.g.,  <br/> `await components.datepicker1.setMaxDate(date)`) or trigger it using an event. |

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| Variable | Description | How To Access |
|:-------- |:----------- |:------------ |
| <div style={{ width:"100px"}}> value </div> | Holds the value entered by the user in the component. | Accessible dynamically with JS (for e.g., `{{components.datepicker1.value}}`).|
| <div style={{ width:"100px"}}> label </div> | Holds the value of the component's label. | Accessible dynamically with JS (for e.g., `{{components.datepicker1.label}}`).|
| <div style={{ width:"100px"}}> isValid </div> | Indicates if the input meets validation criteria. | Accessible dynamically with JS (for e.g., `{{components.datepicker1.isValid}}`).|
| <div style={{ width:"100px"}}> isMandatory </div> | Indicates if the field is required. | Accessible dynamically with JS (for e.g., `{{components.datepicker1.isMandatory}}`).|
| <div style={{ width:"100px"}}> isLoading </div> | Indicates if the component is loading. | Accessible dynamically with JS (for e.g., `{{components.datepicker1.isLoading}}`).|
| <div style={{ width:"100px"}}> isVisible </div> | Indicates if the component is visible. | Accessible dynamically with JS (for e.g., `{{components.datepicker1.isVisible}}`).|
| <div style={{ width:"100px"}}> isDisabled </div> | Indicates if the component is disabled. | Accessible dynamically with JS (for e.g., `{{components.datepicker1.isDisabled}}`).|

</div>

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Disabled Dates              |              |  |
| Custom Rules              |    If the condition is true, the validation passes, otherwise return a string that should be displayed as the error message.         |  |
| Make as mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

<div style={{paddingTop:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility. Toggle or set dynamically.                                                 | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component. Toggle or set dynamically.                                             | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display.                                 | String (e.g., `Are you a registered user?` ).                       |

</div>

<div style={{paddingTop:'24px'}}>

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

<div style={{paddingTop:'24px'}}>

---

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Default Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Visibility | This is to control the visibility of the component. If `{{false}}` the component will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. | By default, it's set to `{{true}}`. |
| Disable | This property only accepts boolean values. If set to `{{true}}`, the component will be locked and becomes non-functional | By default, its value is set to `{{false}}`. |
| Border radius | Use this property to modify the border radius of the date-picker. The field expects only numerical value from `1` to `100` | By default, its value is set to `0`. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

</div>
