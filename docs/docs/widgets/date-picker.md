---
id: date-picker-v2
title: Date Picker
---

The **Date Picker** component can be used for selecting dates without time input. It offers customizable formats, validation, and styling.

## Properties

|  Property  | Description  |  Expected Value |
|:-----------|:-------------|:----------------|
| Label         | Text to display as the label for the field. | String (e.g., `Date of Birth`).         |
| Date Format | Select the date format from the dropdown. Default date format is **DD/MM/YYYY**. | Select from dropdown (e.g. `MM/DD/YYYY`). |
| Default value | The default value that the component will hold when the app is loaded. | String (e.g., `01/01/2022`). |

## Events

|  Event      |  Description  |
|:----------- |:----------- |
| On select | Triggers whenever the user selects a date. |
| On focus  | Triggers whenever the user clicks inside the input field.  |
| On blur   | Triggers whenever the user clicks outside the input field. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

Following actions of component can be controlled using the Component Specific Actions (CSAs), which can be triggered using an event or by using the given RunJS query:

|  Action  |  <div style={{ width:"150px"}}> Description </div>  |  How To Access |
|:----------- |:----------- | :------------ |
| clearValue( ) | Clears the date value.| `components.datepicker1.clearValue()` |
| setValue( ) | Sets the date in the component.| `components.datepicker1.setValue(date)` |
| setDate( ) | Sets the date value. | `components.datepicker1.setDate(date)` |
| setDisabledDates( ) | Disables specific dates.| `components.datepicker1.setDisabledDates([date1, date2])` |
| clearDisabledDates()| Clears all disabled date.|`components.datepicker1.clearDisabledDates()` |
| setMinDate( )| Sets the minimum selectable date.| `components.datepicker1.setMinDate(date)` |
| setMaxDate( )| Sets the maximum selectable date.   | `components.datepicker1.setMaxDate(date)` |
| setFocus( )  | Sets the focus of the cursor on the input field.   | `components.datepicker1.setFocus()` |
| setBlur( )  | Removes the focus of the cursor from the input field. | `components.datepicker1.setBlur()` |
| setVisibility() | Sets the visibility of the component. | `components.datepicker1.setVisibility(false)` |
| setLoading()   | Sets the loading state of the component.         | `components.datepicker1.setLoading(true)` |
| setDisable()   | Disables the component.                           | `components.datepicker1.setDisable(true)` |

## Exposed Variables

Following exposed variables can be dynamically accessed using the given JS query:

| Variable | Description | How To Access |
|:-------- |:----------- |:------------ |
|  value  | Holds the date in the component. | `{{components.datepicker1.value}}` |
|  label  | Holds the value of the component's label. | `{{components.datepicker1.label}}` |
|  unixTimestamp | Holds the value in UNIX format. | `{{components.datepicker1.unixTimestamp}}` |
|  selectedDate  | Holds the value of the selcted date. | `{{components.datepicker1.selectedDate}}` | 
|  dateFormat    | Holds the date format. | `{{components.datepicker1.dateFormat}}` |
|  isValid  | Indicates if the input meets validation criteria. | `{{components.datepicker1.isValid}}` |
|  isMandatory  | Indicates if the field is required. | `{{components.datepicker1.isMandatory}}` |
|  isLoading  | Indicates if the component is loading. | `{{components.datepicker1.isLoading}}` |
|  isVisible  | Indicates if the component is visible. | `{{components.datepicker1.isVisible}}` |
|  isDisabled  | Indicates if the component is disabled. | `{{components.datepicker1.isDisabled}}` |

## Validation

| <div style={{ width:"200px"}}> Validation Option </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{width: "500px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Min Date              | Sets the minimum date allowed.      | Date in correct format (e.g. `01/01/2020`). |
| Max Date         | Sets the maximum date allowed.                | Date in correct format (e.g. `31/12/2026`). |
| Disabled dates| Sets the dates that are not acceptable. |  Date in correct format (e.g. `23/07/2024`). |
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{ !/^\d{4}-\d{2}-\d{2}$/.test(components.datepicker1.value) && "Please enter a valid date in YYYY-MM-DD format" }}`).           |

To add regex inside `Custom Validation`, you can use the below format: 

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**: `{{ /^\d{4}-\d{2}-\d{2}$/.test(components.datepicker1.value) ? '' : "Please enter a valid date in YYYY-MM-DD format" }}`

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress.  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility.       | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component.    | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover.    | String (e.g., `Select your date of birth.` ).                      |

## Devices

| Property  |  Description  | Expected Value  |
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

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
