---
id: date-picker-v2
title: Date Picker
---

The **Date Picker** component can be used for selecting dates without time input. It offers customizable formats, validation, and styling.

## Properties

|  Property  | Description  |  Expected Value |
|:-----------|:-------------|:----------------|
| Label         | Text to display as the label for the field. | String (e.g., `Date of Birth`).         |
| Default value | The default value that the component will hold when the app is loaded. | String (e.g., `01/01/2022`). |
| Format | Select the date format from the dropdown. Default date format is **DD/MM/YYYY**. | Select from dropdown (e.g. `MM/DD/YYYY`). |

## Events

|  Event      |  Description  |
|:----------- |:----------- |
| On select | Triggers whenever the user selects a date. |
| On focus  | Triggers whenever the user clicks inside the input field.  |
| On blur   | Triggers whenever the user clicks outside the input field. |

## Component Specific Actions (CSA)

Following actions of component can be controlled using the Component Specific Actions(CSA), which can be triggered by an event or by the given RunJS query:

|  Action  |  <div style={{ width:"150px"}}> Description </div>  |  How To Access |
|:----------- |:----------- | :------------ |
| clearValue( ) | Clears the date value.| `components.datepicker1.clearValue()` |
| setValue( ) | Sets the date in the component.| `components.datepicker1.setValue(date)` |
| setDate( ) | Sets the date value. | `components.datepicker1.setDate(date)` |
| setDisabledDates( ) | Disables specific dates.| `components.datepicker1.setDisabledDates([date1, date2])` |
| clearDisabledDates()| Clears all disabled dates.|`components.datepicker1.clearDisabledDates()` |
| setMinDate( )| Sets the minimum selectable date.| `components.datepicker1.setMinDate(date)` |
| setMaxDate( )| Sets the maximum selectable date.   | `components.datepicker1.setMaxDate(date)` |
| setFocus( )  | Sets the focus on the component. | `components.datepicker1.setFocus()` |
| setBlur( )  | Closes the component. | `components.datepicker1.setBlur()` |

## Exposed Variables

Following exposed variables can be dynamically accessed using the given JS query:

| Variable | Description | How To Access |
|:-------- |:----------- |:------------ |
|  value  | Holds the date in the component. | `{{components.datepicker1.value}}` |
|  label  | Holds the value of the component's label. | `{{components.datepicker1.label}}` |
|  unixTimestamp | Holds the value in UNIX format. | `{{components.datepicker1.unixTimestamp}}` |
|  selectedDate  | Holds the value of the selected date. | `{{components.datepicker1.selectedDate}}` | 
|  dateFormat    | Holds the date format. | `{{components.datepicker1.dateFormat}}` |
|  isValid  | Indicates if the input meets validation criteria. | `{{components.datepicker1.isValid}}` |
|  isMandatory  | Indicates if the field is required. | `{{components.datepicker1.isMandatory}}` |
|  isLoading  | Indicates if the component is loading. | `{{components.datepicker1.isLoading}}` |
|  isVisible  | Indicates if the component is visible. | `{{components.datepicker1.isVisible}}` |
|  isDisabled  | Indicates if the component is disabled. | `{{components.datepicker1.isDisabled}}` |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the **General** accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

## Additional Actions

|  Action  | Description  | Configuration Options  |
|:------------------|:------------|:------------------------------|
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Devices

| Property  |  Description  | Expected Value  |
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

|  Style  |  Description  | Default Value  |
|:------ |:----------| :-----------|
| Border radius | Use this property to modify the border radius of the date-picker. The field expects only numerical value from `1` to `100`. | By default, its value is set to `0`. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::
