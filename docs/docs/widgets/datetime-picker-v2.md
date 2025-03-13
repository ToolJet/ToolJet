---
id: datetime-picker-v2
title: Date Time Picker
---

The **Date Time Picker** component can be used for selecting dates with time input. It offers customizable formats, validation, and styling.

## Properties

|  Property  | Description  |  Expected Value |
|:-----------|:-------------|:----------------|
| Label         | Text to display as the label for the field. | String (e.g., `Date and Time of Arrival`).         |
| Default value | The default value that the component will hold when the app is loaded. | String (e.g., `01/01/2022 16:00`). |
| Date Format | Select the date format from the dropdown. Default date format is **DD/MM/YYYY**. | Select from dropdown (e.g. `MM/DD/YYYY`). |
| Time Format   | Select the time format from the dropdown. Default time format is **HH:mm**. | Select from dropdown (e.g. `hh:mm A`). |
| Manage time zones | Use the toggle to manage the time zone. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

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
| clearValue( ) | Clears the date value.| `components.datetimepicker1.clearValue()` |
| setValue( ) | Sets both the date and time value. | `components.datetimepicker1.setValue(value)` |
| setDate( ) | Sets the date value. | `components.datetimepicker1.setDate(date)` |
| setTime( )      | Sets the time value. |  `components.datetimepicker1.setTime(time)` |
| setValueinTimeStamp() | Sets the date and time value in the Unix format. | `components.datetimepicker1.setValueinTimeStamp(value)` |
| setDisabledDates( ) | Disables specific dates.| `components.datetimepicker1.setDisabledDates([date1, date2])` |
| clearDisabledDates()| Clears all disabled dates.|`components.datetimepicker1.clearDisabledDates()` |
| setMinDate( )| Sets the minimum selectable date.| `components.datetimepicker1.setMinDate(date)` |
| setMaxDate( )| Sets the maximum selectable date.   | `components.datetimepicker1.setMaxDate(date)` |
| setMinTime( )   | Sets the minimum time that can be selected.	| `components.datetimepicker1.setMinTime(value)` |
| setMaxTime( )   | Sets the maximum time that can be selected.	 | `components.datetimepicker1.setMaxTime(value)` |
| setTimezone( )   | Sets the Timezone.	 | `components.datetimepicker1.setTimezone()` |
| setFocus( )  | Sets the focus of the cursor on the component. | `components.datetimepicker1.setFocus()` |
| setBlur( )  | Removes the focus of the cursor from the component. | `components.datetimepicker1.setBlur()` |


## Exposed Variables

Following exposed variables can be dynamically accessed using the given JS query:

| Variables | <div style={{ width:"200px"}}> Description </div>  | How To Access |
|:---------|:-----------|:-------------|
|  value | Holds the value entered in the component. | `{{components.datetimepicker1.value}}` |
|  label  | Holds the value of the component's label. | `{{components.datetimepicker1.label}}` |
|  valueUnix | Holds the value in UNIX format. | `{{components.datetimepicker1.valueUnix}}` |
|  selectedDate  | Holds the value of the selected date. | `{{components.datetimepicker1.selectedDate}}` | 
|  dateFormat    | Holds the date format. | `{{components.datetimepicker1.dateFormat}}` |
|  selectedTime  | Pass the selected time. |  `{{components.datetimepicker1.selectedTime}}` |
|  timeFormat  | Returns the time format property as a string. |  `{{components.datetimepicker1.timeFormat}}` |
|  selectedTimeZone | Returns the selected time zone. | `{{components.datetimepicker1.selectedTimeZone}}` |
|  isValid  | Indicates if the input meets validation criteria. |  `{{components.datetimepicker1.isValid}})` |
|  isMandatory  | Indicates if the feild is Mandatory. |  `{{components.datetimepicker1.isMandatory}}` |
|  isLoading  | Indicates if the component is loading. | `{{components.datetimepicker1.isLoading}}` |
|  isVisible  | Indicates if the component is visible. | `{{components.datetimepicker1.isVisible}}` |
|  isDisabled  | Indicates if the component is disabled. | `{{components.datetimepicker1.isDisabled}}` |

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
