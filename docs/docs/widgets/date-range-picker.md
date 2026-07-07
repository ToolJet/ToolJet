---
id: date-range-picker
title: Date Range Picker
---

The **Range Picker** component enables users to select a range of dates. It can be used in booking platforms, report filtering, scheduling systems, etc.

<div style={{paddingTop:'24px'}}>

## Properties

|  Property  |  Description  |  Expected Value |
|:-----------|:--------------|:----------------|
| Label         | Text to display as the label for the field.  | String (e.g., `Select Check-In and Check-Out Dates`). |
| Default start date | Set the start date to be selected by default in the component. | Date in correct format (e.g., 01/04/2024).|
| Default end date | Set the end date to be selected by default in the component. | Date in correct format (e.g., 10/04/2024). |
| Format | Defines the date format. Default date format is **DD/MM/YYYY**. | Date format in ISO 8601 defined formats (e.g., `MM/DD/YYYY`). | 

</div>

<div style={{paddingTop:'24px'}}>

## Events

|  Event       |  Description  |
|:-------------|:----------- |
| On select    | Triggers whenever a start date or end date is selected. |
| On focus     | Triggers whenever the user clicks inside the input field.  |
| On blur      | Triggers whenever the user clicks outside the input field. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

Following actions of component can be controlled using the Component Specific Actions (CSAs), which can be triggered using an event or by using the given RunJS query:

|  <div style={{ width:"155px"}}> Action </div>  |  <div style={{ width:"250px"}}> Description </div>  |  How To Access |
|:------------|:----------|:------------|
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
| setVisibility() | Sets the visibility of the component. | `components.daterangepicker1.setVisibility()` |
| setLoading()   | Sets the loading state of the component.         | `components.daterangepicker1.setLoading()` |
| setDisable()   | Disables the component.                           | `components.daterangepicker1.setDisable()` |

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

Following exposed variables can be dynamically accessed using the given JS query:

|  Variables  |  <div style={{ width:"250px"}}> Description </div>  |  How To Access  |
|:----------- |:----------- |:--------- |
| endDate | Holds the date selected as the end date in the component. | `{{components.daterangepicker1.endDate}}` |
| startDate | Holds the date selected as the start date in the component. | `{{components.daterangepicker1.startDate}}` |
| label | Holds the value of the component's label. | `{{components.daterangepicker1.label}}`|
| minDate | Holds the value of the minimum date allowed in the component. | `{{components.daterangepicker1.minDate}}` |
| maxDate | Holds the value of the maximum date allowed in the component. | `{{components.daterangepicker1.maxDate}}` |
| selectedDateRange | Holds the value of the component's date range.|`{{components.daterangepicker1.selectedDateRange}}` |
| startDateInUnix | Holds the start date in Unix timestamp format. | `{{components.daterangepicker1.startDateInUnix}}`  |
| endDateInUnix | Holds the end date in Unix timestamp format. | `{{components.daterangepicker1.endDateInUnix}}` |
| dateFormat | Defines the format in which the selected date range is displayed. | `{{components.daterangepicker1.dateFormat}}`  |
| isMandatory | Indicates if the field is required. | `{{components.daterangepicker1.isMandatory}}`|
| isLoading | Indicates if the component is loading. | `{{components.daterangepicker1.isLoading}}`|
| isVisible | Indicates if the component is visible. | `{{components.daterangepicker1.isVisible}}`|
| isDisabled |  Indicates if the component is disabled. | `{{components.daterangepicker1.isDisabled}}`|

</div>

<div style={{paddingTop:'24px'}}>

## Validation

| <div style={{ width:"200px"}}> Validation Option </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{width: "500px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Min Date              | Sets the minimum date allowed.      | Date in correct format (e.g. `01/01/2020`). |
| Max Date         | Sets the maximum date allowed.                | Date in correct format (e.g. `31/12/2026`). |
| Disabled dates| Sets the dates that are not acceptable. |  Date in correct format (e.g. `23/07/2024`). |
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression |

To add regex inside `Custom Validation`, you can use the below format: 

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**:
```js
{{ 
  (/^\d{4}-\d{2}-\d{2}$/.test(components.daterangepicker1.startDate) && 
   /^\d{4}-\d{2}-\d{2}$/.test(components.daterangepicker1.endDate)) 
    ? '' 
    : "Please enter a valid date in YYYY-MM-DD format" 
}}
```

</div>

<div style={{paddingTop:'24px'}}>

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress.  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility.       | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component.    | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover.    | String (e.g., `Select your booking dates.` ).                      |

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile  | Makes the component visible in mobile view.  | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

<div style={{paddingTop:'24px'}}>

## Styles

### Label

| Property | Description |
|----------|-------------|
| Label Color | Sets the color of the label text. |
| Alignment | Determines the label's position, choose between top/side and left/right alignment. |
| Width | Specifies the percentage of the component’s width that the label should occupy. |

### Color

| Property | Description |
|----------|-------------|
| Background | Sets the background color of the component. |
| Border | Defines the color of the component’s border. |
| Accent | Specifies the accent color used for highlights or focus indicators. |
| Text | Sets the text color inside the component. |
| Error text| Color applied to error messages. |

### Input Field

| Property | Description |
|----------|-------------|
| Icon | Adds an icon to the component, usually for visual cues or actions. |
| Icon Color | Sets the color of the icon. |
| Icon Position | Defines the position of the icon (e.g., left, right). |
| Border radius | Controls the roundness of the component's input field. |
| Box shadow | Applies shadow styling to the input field. |
| Padding | Sets the internal spacing between the content and the input field edges. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

</div>
