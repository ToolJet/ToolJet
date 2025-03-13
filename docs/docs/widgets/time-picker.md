---
id: time-picker
title: Time Picker
---

The **Time Picker** component can be used for selecting time without date input. It offers customizable formats, validation, and styling.

## Properties

|   Property    | Description | Expected Value |
|:--------------|:------------|----------------|
| Label         | The text to be used as the label for the Time Picker. | String (e.g., `Time of Arrival`). |
| Default value | The default value that the component will hold when the app is loaded. | String (e.g., `11:00`). |
| Time Format   | Select the time format from the dropdown. Default time format is **HH:mm**. | Select from dropdown (e.g. `hh:mm A`). |
| Manage time zones | Use the toggle to manage the time zone. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Events

|    Event    | Description |
|:----------- |:----------- |
| On select | Triggers whenever the user selects a time. |
| On focus | Triggers whenever the user clicks inside the time picker. |
| On blur | Triggers whenever the user clicks outside the time picker. |

## Component Specific Actions (CSA)

Following actions of component can be controlled using the Component Specific Actions(CSA), which can be triggered by an event or by the given RunJS query:

|  Action |  <div style={{ width:"200px"}}> Description </div> | How To Access |
| :-------------- | :---------- | :------------ |
| clearValue( )     | Clears the value of the time picker.    |  `components.timepicker1.clearValue()` |
| setValue( )     | Sets both the date and time value.   |  `components.timepicker1.setValue(value)` |
| setTime( )      | Sets time in the time picker component. |  `components.timepicker1.setTime(time)` |
| setValueinTimeStamp() | Sets the date and time value in the Unix format. | `components.timepicker1.setValueinTimeStamp(value)` |
| setMinTime( )   | Sets the minimum time that can be selected in the time picker.	| `components.timepicker1.setMinTime(value)` |
| setMaxTime( )   | Sets the maximum time that can be selected in the time picker.	 | `components.timepicker1.setMaxTime(value)` |
| setTimezone( )   | Sets the Timezone of the time picker.	 | `components.timepicker1.setTimezone()` |
| setLoading( )   | Sets the loading state of the time picker.	 | `components.timepicker1.setLoading()` |
| setVisibility( )   | Sets the visibility state of the time picker.	 | `components.timepicker1.setVisibility()` |
| setDisable( )   | Disables the time picker.	 | `components.timepicker1.setDisable()` |
| setFocus( )   | Sets the focus of the cursor on the time picker. | `components.timepicker1.setLoading()` |
| setBlur( )   | Removes the focus of the cursor from the time picker. | `components.timepicker1.setBlur()` |

## Exposed Variables

Following exposed variables can be dynamically accessed using the given JS query:

| Variables | <div style={{ width:"200px"}}> Description </div>  | How To Access |
|:---------|:-----------|:-------------|
|  value | This component holds the value entered in the time picker. | `{{components.timepicker1.value}}` |
|  label  | Holds the value of the component's label. | `{{components.timepicker1.label}}` |
|  valueUnix | Holds the value in UNIX format. | `{{components.timepicker1.valueUnix}}` |
|  selectedTime  | Pass the selected time. |  `{{components.timepicker1.selectedTime}}` |
|  timeFormat  | Returns the time format property as a string. |  `{{components.timepicker1.timeFormat}}` |
|  selectedTimeZone | Returns the selected time zone. | `{{components.timepicker1.selectedTimeZone}}` |
|  isValid  | Indicates if the input meets validation criteria. |  `{{components.timepicker1.isValid}})` |
|  isMandatory  | Indicates if the feild is Mandatory. |  `{{components.timepicker1.isMandatory}}` |
|  isLoading  | Indicates if the component is loading. | `{{components.timepicker1.isLoading}}` |
|  isVisible  | Indicates if the component is visible. | `{{components.timepicker1.isVisible}}` |
|  isDisabled  | Indicates if the component is disabled. | `{{components.timepicker1.isDisabled}}` |

## Validation

| Validation Option | <div style={{ width:"200px"}}> Description </div> |  Expected Value |
|:---------------|:---------------|:----------------|
| Min Time |  Specifies the earliest selectable time. Any time before the Min Time will be disabled. | String (for e.g., `05:35`) |
| Max Time  | Specifies the latest selectable time. Any time after the Max Time will be disabled.  | String (for e.g., `15:45`) |
| Custom validation | Add a custom validation for the time input using the ternary operator. | Custom Validation Statement (for e.g., `{{moment(components.timepicker1.value, '18:35').isAfter(moment()) ? true : 'You are late!'}}`) |
| Make as mandatory | Makes the field mandatory. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General

### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the **General** accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

## Additional Actions

|  Action    |  Description  |  Configuration Options |
|:-----------|:--------------|:------------|
| Loading State | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility  | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable  | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.|

## Devices

|  Property |  Description |  Expected Value |
|:----------|:-------------|:----------------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile  | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
