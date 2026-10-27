---
id: datetime-picker-v2
title: Date Time Picker
---

The **Date Time Picker** component can be used for selecting dates with time input. It offers customizable formats, validation, and styling.

## Properties

| Property | Description | Expected Value |
| :------- | :---------- | :------------- |
| Label | Text to display as the label for the field. | String (e.g., `Date and Time of Arrival`). |
| Date Format | Select the date format from the dropdown. Default date format is **DD/MM/YYYY**. | Select from dropdown (e.g. `MM/DD/YYYY`). |
| Time Format | Select the time format from the dropdown. Default time format is **HH:mm**. | Select from dropdown (e.g. `hh:mm A`). |
| Manage time zones | Use the toggle to manage the time zone. When enabled, two dropdowns appear: **Display in** sets the time zone the value is shown in, and **Store in** sets the time zone the value is stored in. Both default to `UTC`. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Placeholder | Text shown in the field when no date and time is selected. Default value is **Select date and time**. | String (e.g., `Select arrival date and time`). |
| Default value | The default value that the component will hold when the app is loaded. | String (e.g., `01/01/2022 16:00`). |

:::caution
Click the **fx** button next to **Date Format** or **Time Format** to enter a custom format string. ToolJet uses **[Moment.js](https://momentjs.com/docs/#/displaying/format/)** to parse and format dates and times, so the format string must use Moment.js tokens, and these tokens are case-sensitive — for example, `D` is the day of the month (`1`–`31`), while lowercase `d` is the day of the week (`0`–`6`, Sunday to Saturday). Also note that `YYYY` gives a 4-digit year, but lowercase `yyyy` isn't a valid Moment.js token and gets rendered as literal text. Use a format like `MMM D, YYYY` (e.g., `Jan 5, 2024`), not `MMM d, yyyy`.
:::

## Events

| Event     | Description                                                |
| :-------- | :--------------------------------------------------------- |
| On select | Triggers whenever the user selects a date.                 |
| On focus  | Triggers whenever the user clicks inside the input field.  |
| On blur   | Triggers whenever the user clicks outside the input field. |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

Following actions of component can be controlled using the Component Specific Actions(CSA), which can be triggered by an event or by the given RunJS query:

| Action                | <div style={{ width:"150px"}}> Description </div>                 | How To Access                                                 |
| :-------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------ |
| clearValue( )         | Clears the date value.                                            | `components.datetimepicker1.clearValue()`                     |
| setValue( )           | Sets both the date and time value. Pass the value in the Date Format and Time Format (e.g., `01/01/2022 16:00`). An optional second argument sets a different format to parse the value with. | `components.datetimepicker1.setValue(value, format)`          |
| setDate( )            | Sets the date value and keeps the time. An optional second argument sets the format. | `components.datetimepicker1.setDate(date, format)`                    |
| setTime( )            | Sets the time value and keeps the date. An optional second argument sets the format. | `components.datetimepicker1.setTime(time, format)`                    |
| setValueInTimestamp( ) | Sets the date and time from an ISO 8601 timestamp string (e.g., `2024-07-23T10:30:00.000Z`). | `components.datetimepicker1.setValueInTimestamp(value)`       |
| setDisabledDates( )   | Disables specific dates.                                          | `components.datetimepicker1.setDisabledDates([date1, date2])` |
| clearDisabledDates()  | Clears all disabled dates.                                        | `components.datetimepicker1.clearDisabledDates()`             |
| setMinDate( )         | Sets the minimum selectable date.                                 | `components.datetimepicker1.setMinDate(date)`                 |
| setMaxDate( )         | Sets the maximum selectable date.                                 | `components.datetimepicker1.setMaxDate(date)`                 |
| setMinTime( )         | Sets the minimum time that can be selected.                       | `components.datetimepicker1.setMinTime(value)`                |
| setMaxTime( )         | Sets the maximum time that can be selected.                       | `components.datetimepicker1.setMaxTime(value)`                |
| setDisplayTimezone( ) | Sets the time zone in which the selected time is displayed. Pass a UTC offset from the **Display in** list, such as `'+05:30'` or `'UTC'`. Works only when **Manage time zones** is enabled. | `components.datetimepicker1.setDisplayTimezone('+05:30')`        |
| setStoreTimezone( )   | Sets the time zone in which the selected time is stored. Pass a UTC offset from the **Store in** list, such as `'+05:30'` or `'UTC'`. Works only when **Manage time zones** is enabled. | `components.datetimepicker1.setStoreTimezone('UTC')`          |
| setVisibility( )      | Sets the visibility state of the date time picker.                | `components.datetimepicker1.setVisibility(true)`              |
| setLoading( )         | Sets the loading state of the date time picker.                   | `components.datetimepicker1.setLoading(true)`                 |
| setDisable( )         | Disables the date time picker.                                    | `components.datetimepicker1.setDisable(true)`                 |
| setFocus( )           | Sets the focus of the cursor on the date time picker.             | `components.datetimepicker1.setFocus()`                       |
| setBlur( )            | Removes the focus of the cursor from the date time picker.        | `components.datetimepicker1.setBlur()`                        |

## Exposed Variables

Following exposed variables can be dynamically accessed using the given JS query:

| Variables       | <div style={{ width:"200px"}}> Description </div>       | How To Access                                    |
| :-------------- | :------------------------------------------------------ | :----------------------------------------------- |
| value           | Holds the value entered in the component.               | `{{components.datetimepicker1.value}}`           |
| label           | Holds the value of the component's label.               | `{{components.datetimepicker1.label}}`           |
| minTime         | Holds the earliest selectable time.                     | `{{components.datetimepicker1.minTime}}`         |
| maxTime         | Holds the latest selectable time.                       | `{{components.datetimepicker1.maxTime}}`         |
| minDate         | Holds the minimum date allowed.                         | `{{components.datetimepicker1.minDate}}`         |
| maxDate         | Holds the maximum date allowed.                         | `{{components.datetimepicker1.maxDate}}`         |
| unixTimestamp   | Holds the value as a Unix timestamp in milliseconds.    | `{{components.datetimepicker1.unixTimestamp}}`   |
| selectedDate    | Holds the value of the selected date.                   | `{{components.datetimepicker1.selectedDate}}`    |
| displayValue    | Holds the display value of the component.               | `{{components.datetimepicker1.displayValue}}`    |
| dateFormat      | Holds the date format.                                  | `{{components.datetimepicker1.dateFormat}}`      |
| selectedTime    | Holds the selected time in the Time Format.             | `{{components.datetimepicker1.selectedTime}}`    |
| timeFormat      | Returns the time format property as a string.           | `{{components.datetimepicker1.timeFormat}}`      |
| storeTimezone   | Returns the time zone in which value will be stored.    | `{{components.datetimepicker1.storeTimezone}}`   |
| displayTimezone | Returns the time zone in which value will be displayed. | `{{components.datetimepicker1.displayTimezone}}` |
| isValid         | Indicates if the input meets validation criteria.       | `{{components.datetimepicker1.isValid}}`        |
| isMandatory     | Indicates if the field is Mandatory.                    | `{{components.datetimepicker1.isMandatory}}`     |
| isLoading       | Indicates if the component is loading.                  | `{{components.datetimepicker1.isLoading}}`       |
| isVisible       | Indicates if the component is visible.                  | `{{components.datetimepicker1.isVisible}}`       |
| isDisabled      | Indicates if the component is disabled.                 | `{{components.datetimepicker1.isDisabled}}`      |

## Validation

| Validation Option | <div style={{ width:"200px"}}> Description </div> | Expected Value |
| :---------------- | :------------------------------------------------ | :------------- |
| Min Date | Sets the minimum date allowed. | Date in correct format (e.g. `01/01/2020`). |
| Max Date | Sets the maximum date allowed. | Date in correct format (e.g. `31/12/2026`). |
| Min Time | Specifies the earliest selectable time. | String (for e.g., `05:35`) |
| Max Time | Specifies the latest selectable time. | String (for e.g., `15:45`) |
| Disabled dates | Sets the dates that are not acceptable. | An array of dates in the Date Format (e.g. `{{['23/07/2024', '24/07/2024']}}`). |
| Custom validation | Add a custom validation for the date time input using the ternary operator. | Custom Validation Statement (for e.g., `{{ moment(components.datetimepicker1.value).isAfter(moment()) ? true : 'You are late!' }}`) | 
| Make this field mandatory | Makes the field mandatory. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Supports **Plain text**, **Markdown**, and **HTML** formats. | String (e.g., `Select the date & time of arrival.`). |

## Devices

| Property | Description | Expected Value |
| :------- | :---------- | :------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile  | Makes the component visible in mobile view.  | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| Property    | Description                                                                        |
| ----------- | ---------------------------------------------------------------------------------- |
| Label Color | Sets the color of the label text.                                                  |
| Alignment   | Determines the label's position, choose between top/side and left/right alignment. |
| Width       | Specifies the percentage of the component’s width that the label should occupy.    |

### Color

| Property   | Description                                                         |
| ---------- | ------------------------------------------------------------------- |
| Background | Sets the background color of the component.                         |
| Border     | Defines the color of the component’s border.                        |
| Accent     | Specifies the accent color used for highlights or focus indicators. |
| Text       | Sets the text color inside the component.                           |
| Error text | Color applied to error messages.                                    |

### Input Field

| Property      | Description                                                              |
| ------------- | ------------------------------------------------------------------------ |
| Icon          | Adds an icon to the component, usually for visual cues or actions.       |
| Icon Color    | Sets the color of the icon.                                              |
| Icon Position | Defines the position of the icon (e.g., left, right).                    |
| Border radius | Controls the roundness of the component's input field.                   |
| Box shadow    | Applies shadow styling to the input field.                               |
| Padding       | Sets the internal spacing between the content and the input field edges. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::
