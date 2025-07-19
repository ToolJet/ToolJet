---
id: time-picker
title: Time Picker
---

The **Time Picker** component can be used for selecting time without date input. It offers customizable formats, validation, and styling.

## Properties

|   Property    | Description | Expected Value |
|:--------------|:------------|----------------|
| Label         | The text to be used as the label for the Time Picker. | String (e.g., `Time of Arrival`). |
| Time Format   | Select the time format from the dropdown. Default time format is **HH:mm**. | Select from dropdown (e.g. `hh:mm A`). |
| Manage time zones | Use the toggle to manage the time zone. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Default value | The default value that the component will hold when the app is loaded. | String (e.g., `11:00`). |

## Events

|    Event    | Description |
|:----------- |:----------- |
| On select | Triggers whenever the user selects a time. |
| On focus | Triggers whenever the user clicks inside the time picker. |
| On blur | Triggers whenever the user clicks outside the time picker. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

Following actions of component can be controlled using the Component Specific Actions(CSA), which can be triggered by an event or by the given RunJS query:

|  Action |  <div style={{ width:"200px"}}> Description </div> | How To Access |
| :-------------- | :---------- | :------------ |
| setTime( )      | Sets time in the time picker component. |  `components.timepicker1.setTime(time)` |
| setValue( )     | Sets both the date and time value.   |  `components.timepicker1.setValue(value)` |
| setMinTime( )   | Sets the minimum time that can be selected in the time picker.	| `components.timepicker1.setMinTime(value)` |
| setMaxTime( )   | Sets the maximum time that can be selected in the time picker.	 | `components.timepicker1.setMaxTime(value)` |
| clearValue( )     | Clears the value of the time picker.    |  `components.timepicker1.clearValue()` |
| setValueinTimeStamp() | Sets the date and time value in the Unix format. | `components.timepicker1.setValueinTimeStamp(value)` |
| setDisplayTimezone( )   | Sets the timezone in which the selected time will be displayed.	 | `components.timepicker1.setDisplayTimezone(value)` |
| setStoreTimezone( )   | Specifies the timezone in which the selected time will be stored.	 | `components.timepicker1.setStoreTimezone(value)` |
| setVisibility( )   | Sets the visibility state of the time picker.	 | `components.timepicker1.setVisibility()` |
| setLoading( )   | Sets the loading state of the time picker.	 | `components.timepicker1.setLoading()` |
| setDisable( )   | Disables the time picker.	 | `components.timepicker1.setDisable()` |
| setFocus( )   | Sets the focus of the cursor on the time picker. | `components.timepicker1.setLoading()` |
| setBlur( )   | Removes the focus of the cursor from the time picker. | `components.timepicker1.setBlur()` |

## Exposed Variables

Following exposed variables can be dynamically accessed using the given JS query:

| Variables | <div style={{ width:"200px"}}> Description </div>  | How To Access |
|:---------|:-----------|:-------------|
|  value | This component holds the value entered in the Time Picker component. | `{{components.timepicker1.value}}` |
|  label  | Holds the value of the component's label. | `{{components.timepicker1.label}}` |
|  minTime  | Holds the earliest selectable time. | `{{components.timepicker1.minTime}}` |
|  maxTime  | Holds the latest selectable time. | `{{components.timepicker1.maxTime}}` |
|  selectedTime  | Holds the value of selected time. |  `{{components.timepicker1.selectedTime}}` |
|  unixTimestamp | Holds the value in UNIX format. | `{{components.timepicker1.unixTimestamp}}` |
|  displayValue | Holds the display value of the component. | `{{components.timepicker1.displayValue}}` |
|  timeFormat  | Returns the time format as a string. |  `{{components.timepicker1.timeFormat}}` |
|  storeTimezone | Returns the time zone in which value will be stored. | `{{components.timepicker1.storeTimezone}}` |
|  displayTimezone | Returns the time zone in which value will be displayed.  | `{{components.timepicker1.displayTimezone}}` |
|  isValid  | Indicates if the input meets validation criteria. |  `{{components.timepicker1.isValid}})` |
|  isMandatory  | Indicates if the field is Mandatory. |  `{{components.timepicker1.isMandatory}}` |
|  isLoading  | Indicates if the component is loading. | `{{components.timepicker1.isLoading}}` |
|  isVisible  | Indicates if the component is visible. | `{{components.timepicker1.isVisible}}` |
|  isDisabled  | Indicates if the component is disabled. | `{{components.timepicker1.isDisabled}}` |

## Validation

| Validation Option | <div style={{ width:"200px"}}> Description </div> |  Expected Value |
|:---------------|:---------------|:----------------|
| Min Time |  Specifies the earliest selectable time. Any time before the Min Time will be disabled. | String (for e.g., `05:35`) |
| Max Time  | Specifies the latest selectable time. Any time after the Max Time will be disabled.  | String (for e.g., `15:45`) |
| Custom validation | Add a custom validation for the time input using the ternary operator. | Custom Validation Statement (for e.g., `{{moment(components.timepicker1.value).format('HH:mm') > moment().format('HH:mm') ? true : 'You are late!' }}`) |
| Make this field mandatory | Makes the field mandatory. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress.  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility.       | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component.    | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover.    | String (e.g., `Select the time of arrival.`).                      |

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