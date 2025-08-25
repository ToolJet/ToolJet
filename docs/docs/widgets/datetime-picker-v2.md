---
id: datetime-picker-v2
title: Date Time Picker
---

The **Date Time Picker** component can be used for selecting dates with time input. It offers customizable formats, validation, and styling.

## Properties

|  Property  | Description  |  Expected Value |
|:-----------|:-------------|:----------------|
| Label         | Text to display as the label for the field. | String (e.g., `Date and Time of Arrival`).         |
| Date Format | Select the date format from the dropdown. Default date format is **DD/MM/YYYY**. | Select from dropdown (e.g. `MM/DD/YYYY`). |
| Time Format   | Select the time format from the dropdown. Default time format is **HH:mm**. | Select from dropdown (e.g. `hh:mm A`). |
| Manage time zones | Use the toggle to manage the time zone. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Default value | The default value that the component will hold when the app is loaded. | String (e.g., `01/01/2022 16:00`). |

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
| setDisplayTimezone( )   | Sets the timezone in which the selected time will be displayed.	 | `components.datetimepicker1.setDisplayTimezone(value)` |
| setStoreTimezone( )   | Specifies the timezone in which the selected time will be stored.	 | `components.datetimepicker1.setStoreTimezone(value)` |
| setVisibility( )   | Sets the visibility state of the date time picker.	 | `components.datetimepicker1.setVisibility()` |
| setLoading( )   | Sets the loading state of the date time picker.	 | `components.datetimepicker1.setLoading()` |
| setDisable( )   | Disables the date time picker.	 | `components.datetimepicker1.setDisable()` |
| setFocus( )   | Sets the focus of the cursor on the date time picker. | `components.datetimepicker1.setLoading()` |
| setBlur( )   | Removes the focus of the cursor from the date time picker. | `components.datetimepicker1.setBlur()` |

## Exposed Variables

Following exposed variables can be dynamically accessed using the given JS query:

| Variables | <div style={{ width:"200px"}}> Description </div>  | How To Access |
|:---------|:-----------|:-------------|
|  value | Holds the value entered in the component. | `{{components.datetimepicker1.value}}` |
|  label  | Holds the value of the component's label. | `{{components.datetimepicker1.label}}` |
|  minTime  | Holds the earliest selectable time. | `{{components.datetimepicker1.minTime}}` |
|  maxTime  | Holds the latest selectable time. | `{{components.datetimepicker1.maxTime}}` |
|  minDate  | Sets the minimum date allowed.  | `{{components.datetimepicker1.minDate}}`|
|  maxDate  | Sets the maximum date allowed.  | `{{components.datetimepicker1.maxDate}}` |
|  unixTimestamp | Holds the value in UNIX format. | `{{components.datetimepicker1.unixTimestamp}}` |
|  selectedDate  | Holds the value of the selected date. | `{{components.datetimepicker1.selectedDate}}` |
|  displayValue | Holds the display value of the component. | `{{components.datetimepicker1.displayValue}}` | 
|  dateFormat    | Holds the date format. | `{{components.datetimepicker1.dateFormat}}` |
|  selectedTime  | Pass the selected time. |  `{{components.datetimepicker1.selectedTime}}` |
|  timeFormat  | Returns the time format property as a string. |  `{{components.datetimepicker1.timeFormat}}` |
|  storeTimezone | Returns the time zone in which value will be stored. | `{{components.datetimepicker1.storeTimezone}}` |
|  displayTimezone | Returns the time zone in which value will be displayed.  | `{{components.datetimepicker1.displayTimezone}}` |
|  isValid  | Indicates if the input meets validation criteria. |  `{{components.datetimepicker1.isValid}})` |
|  isMandatory  | Indicates if the field is Mandatory. |  `{{components.datetimepicker1.isMandatory}}` |
|  isLoading  | Indicates if the component is loading. | `{{components.datetimepicker1.isLoading}}` |
|  isVisible  | Indicates if the component is visible. | `{{components.datetimepicker1.isVisible}}` |
|  isDisabled  | Indicates if the component is disabled. | `{{components.datetimepicker1.isDisabled}}` |

## Validation

| Validation Option | <div style={{ width:"200px"}}> Description </div> |  Expected Value |
|:---------------|:---------------|:----------------|
| Min Date              | Sets the minimum date allowed.      | Date in correct format (e.g. `01/01/2020`). |
| Max Date         | Sets the maximum date allowed.                | Date in correct format (e.g. `31/12/2026`). |
| Min Time |  Specifies the earliest selectable time. | String (for e.g., `05:35`) |
| Max Time  | Specifies the latest selectable time.| String (for e.g., `15:45`) |
| Disabled dates| Sets the dates that are not acceptable. |  Date in correct format (e.g. `23/07/2024`). |
| Custom validation | Add a custom validation for the date time input using the ternary operator. | Custom Validation Statement (for e.g., `{{ moment(components.datetimepicker1.value).isAfter(moment()) ? true : 'You are late!' }}`) |
| Make this field mandatory | Makes the field mandatory. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress.  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility.       | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component.    | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover.    | String (e.g., `Select the date & time of arrival.`).                      |

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
