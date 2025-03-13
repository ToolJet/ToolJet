---
id: date-range-picker
title: Date Range Picker
---

The **Range Picker** component enables users to select a range of dates. It can be used in booking platforms, report filtering, scheduling systems, etc.

## Properties

|  Property  |  Description  |  Expected Value |
|:-----------|:--------------|:----------------|
| Label         | Text to display as the label for the field.  | String (e.g., `Select Check-In and Check-Out Dates`). |
| Default start date | Set the start date to be selected by default in the component. | Date in correct format (e.g., 01/04/2024).|
| Default end date | Set the end date to be selected by default in the component. | Date in correct format (e.g., 10/04/2024). |
| Format | Defines the date format. Default date format is **DD/MM/YYYY**. | Date format in ISO 8601 defined formats (e.g., `MM/DD/YYYY`). | 


## Events

|  Event       |  Description  |
|:-------------|:----------- |
| On select    | Triggers whenever a start date or end date is selected. |
| On focus     | Triggers whenever the user clicks inside the input field.  |
| On blur      | Triggers whenever the user clicks outside the input field. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::


## Component Specific Actions (CSA)

Following actions of component can be controlled using the Component Specific Actions(CSA), which can be triggered using an event or by using the given RunJS query:

|  <div style={{ width:"155px"}}> Action </div>  |  <div style={{ width:"250px"}}> Description </div>  |  How To Access |
|:------------|:----------|:------------|
| isValid( ) | Sets the validation status of the selected date range.   |  `components.daterangepicker1.isValid()`  |
| setStartDate( ) | Sets the start date of the selected date range. | `components.daterangepicker1.setStartDate(date)`  |
| clearStartDate( ) |  Clears the selected start date. | `components.daterangepicker1.clearStartDate()` |
| setEndDate( ) | Sets the end date of the selected date range. | ` await components.daterangepicker1.setEndDate(date)` |
| clearEndDate( ) | Clears the selected end date. | `components.daterangepicker1.clearEndDate()` |
| setDateRange( ) | Sets both the start and end dates of the selected date range. | `components.daterangepicker1.setDateRange(startDate, endDate)` |
| clearDateRange( ) | Clears both the start and end dates. |  `components.daterangepicker1.clearDateRange()` |
| setDisabledDates( ) | Sets specific dates as disabled, preventing selection. | `components.daterangepicker1.setDisabledDates([date1, date2])` |
| clearDisabledDates( ) | Clears all disabled date restrictions. | `components.daterangepicker1.clearDisabledDates()` |
| setMinDate( ) | Sets the minimum selectable date. | `components.daterangepicker1.setMinDate(date)` |
| setMaxDate( ) | Sets the maximum selectable date. | `components.daterangepicker1.setMaxDate(date)` |
| setFocus( )     | Sets the focus of the cursor on the input field.   | `components.daterangepicker1.setFocus()` |
| setBlur( )      | Removes the focus of the cursor from the input field. | `components.daterangepicker1.setBlur()` |


## Exposed Variables

Following exposed variables can be dynamically accessed using the given JS query:

|  Variables  |  <div style={{ width:"250px"}}> Description </div>  |  How To Access  |
|:----------- |:----------- |:--------- |
| endDate | Holds the date selected as the end date in the component. | `{{components.daterangepicker1.endDate}}` |
| startDate | Holds the date selected as the start date in the component. | `{{components.daterangepicker1.startDate}}` |
| label | Holds the value of the component's label. | `{{components.daterangepicker1.label}}`|
| selectedDateRange | Holds the value of the component's date range.|`{{components.daterangepicker1.selectedDateRange}}` |
| startDateInUnix | Holds the start date in Unix timestamp format. | `{{components.daterangepicker1.startDateInUnix}}`  |
| endDateInUnix | Holds the end date in Unix timestamp format. | `{{components.daterangepicker1.endDateInUnix}}` |
| dateFormat | Defines the format in which the selected date range is displayed. | `{{components.daterangepicker1.dateFormat}}`  |
| isMandatory | Indicates if the field is required. | `{{components.daterangepicker1.isMandatory}}`|
| isLoading | Indicates if the component is loading. | `{{components.daterangepicker1.isLoading}}`|
| isVisible | Indicates if the component is visible. | `{{components.daterangepicker1.isVisible}}`|
| sDisabled |  Indicates if the component is disabled. | `{{components.daterangepicker1.isDisabled}}`|


## Additional Actions

|  Action  | Description  | Configuration Options  |
|:---------|:-------------|:-----------------------|
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |


## Devices

|  Property  |  Description  |  Expected Value  |
|:-----------|:--------------| :----------------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile  | Makes the component visible in mobile view.  | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |


## Styles

|  Style  |  Description  |  Default Value  |
|:--------|:--------------| :---------------|
| Border radius | This is to modify the border radius of the date range picker. The field expects only numerical value from `1` to `100`. | By default, it's set to `0`. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

