---
id: date-range
title: Date range 
---

The **Date Range** component enables users to select a range of dates with advanced controls, including Unix format support, validation, visibility management, and customizable styling. It is used in booking platforms, report filtering, and scheduling systems where precise date selection is required.

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the field.           | String (e.g., `Date`).         |
| Default start date | Set the start date to be selected by default in the component. | 01/04/2024 |
| Default end date | Set the start date to be selected by default in the component. | 10/04/2024 |
| Format | The format of the date selected by the date picker. Default date format is **DD/MM/YYYY**. Date format should be followed as ISO 8601 as mentioned in the [moment documentation](https://momentjs.com/docs/). |

</div>

<div style={{paddingTop:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event  </div>    | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On select | Triggers whenever a start date or end date is selected in the date range picker component. |
| On focus     | Triggers whenever the user clicks inside the input field.                                        |
| On blur      | Triggers whenever the user clicks outside the input field.                                       |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| isValid() | Sets the validation status of the selected date range   |  Employ a RunJS query (e.g., <br/> `await components.daterange1.isValid()`) or trigger it using an event to check whether the selected date range is valid based on the defined constraints.  |
| setStartDate()| Sets the start date of the selected date range. | Employ a RunJS query (e.g., <br/> `await components.daterange1.setStartDate(date)`) or trigger it using an event to set the start date of the selected date range.  |
| clearStartDate()|  Clears the selected start date. | Employ a RunJS query (e.g., <br/> `await components.daterange1.clearStartDate()`) or trigger it using an event to clear the selected start date. |
| setEndDate()| Sets the end date of the selected date range. | Employ a RunJS query (e.g., <br/> ` await components.daterange1.setEndDate(date)`) or trigger it using an event to set the end date of the selected date range. |
| clearEndDate()| Clears the selected end date. | Employ a RunJS query (e.g., <br/> `await components.daterange1.clearEndDate()`) or trigger it using an event to clear the selected end date. |
| setDateRange()| Sets both the start and end dates of the selected date range. | Employ a RunJS query (e.g., <br/> `await components.daterange1.setDateRange(startDate, endDate)`) or trigger it using an event to set both the start and end dates of the selected date range. |
| clearDateRange()| Clears both the start and end dates. |  Employ a RunJS query (e.g., <br/> `await components.daterange1.clearDateRange()`) or trigger it using an event to clear both the start and end dates. |
| setDisabledDates()| Sets specific dates as disabled, preventing selection. | Employ a RunJS query (e.g., <br/> `await components.daterange1.setDisabledDates([date1, date2])`) or trigger it using an event to set specific dates as disabled, preventing selection. |
| clearDisabledDates()| Clears all disabled date restrictions. | Employ a RunJS query (e.g., <br/> `await components.daterange1.clearDisabledDates()`)or trigger it using an event to clear all disabled date restrictions. |
| setMinDate()| Sets the minimum selectable date. | Employ a RunJS query (e.g., <br/> `await components.daterange1.setMinDate(date)`) or trigger it using an event to set the minimum selectable date. |
| setMaxDate()| Sets the maximum selectable date. | Employ a RunJS query (e.g., <br/> `await components.daterange1.setMaxDate(date)`) or trigger it using an event to set the maximum selectable date. |
| setFocus()     | Sets the focus of the cursor on the input field.   | Employ a RunJS query (for e.g.,  <br/> `await components.daterange1.setFocus()`) or trigger it using an event. |
| setBlur()      | Removes the focus of the cursor from the input field. | Employ a RunJS query (for e.g.,  <br/> `await components.daterange1.setBlur()`) or trigger it using an event. |

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:--------- |
| endDate | Holds the date selected as the end date in the component. | Accessible dynamically with JS (e.g., `{{components.daterange1.endDate}}`). |
| startDate | Holds the date selected as the start date in the component. | Accessible dynamically with JS (e.g., `{{components.daterange1.startDate}}`). |
| label | Holds the value of the component's label. | Accessible dynamically with JS (for e.g., `{{components.daterange1.label}}`).|
| selectedDateRange | Holds the value of the component's date range.|Accessible dynamically with JS (e.g., `{{components.daterange1.selectedDateRange}}`). |
| startDateInUnix - Unix datatype | Holds the start date in Unix timestamp format. | Accessible dynamically with JS (e.g., `{{components.daterange1.startDateInUnix}}` ). |
| endDateInUnix - Unix datatype | Holds the end date in Unix timestamp format. | Accessible dynamically with JS (e.g., `{{components.daterange1.endDateInUnix}}`). |
| dateFormat | Defines the format in which the selected date range is displayed. | Accessible dynamically with JS (e.g., `{{components.daterange1.dateFormat}}` ). |
| isMandatory | Indicates if the field is required. | Accessible dynamically with JS (for e.g., `{{components.daterange1.isMandatory}}`).|
| isLoading | Indicates if the component is loading. | Accessible dynamically with JS (for e.g., `{{components.daterange1.isLoading}}`).|
| isVisible | Indicates if the component is visible. | Accessible dynamically with JS (for e.g., `{{components.daterange1.isVisible}}`).|
| sDisabled |  Indicates if the component is disabled. | Accessible dynamically with JS (for e.g., `{{components.daterange1.isDisabled}}`).|

</div>

<div style={{paddingTop:'24px'}}>

## Validation

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile  | Makes the component visible in mobile view.  | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

---

<div style={{paddingTop:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Default Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Border radius | This is to modify the border radius of the date range picker. The field expects only numerical value from `1` to `100`. | By default, it's set to `0`. |
| Visibility | This is to control the visibility of the component. If `{{false}}` the component will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. | By default, it's set to `{{true}}`. |
| Disable | This property only accepts boolean values. If set to `{{true}}`, the component will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

</div>
