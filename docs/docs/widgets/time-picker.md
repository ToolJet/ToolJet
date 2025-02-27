---
id: timepicker
title: Time Picker
---
# Time Picker

The **Time Picker** widget allows users to select a single value for time from a pre-determined set.

<div style={{paddingTop:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property  </div>    | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| Label | The text to be used as the label for the Time Picker. |
| Default value | This value acts as placeholder for the time picker component, if any value is not provided then the default value will be used from the picker. |
| Format | This value acts as placeholder for the time picker component, if any value is not provided then the default value will be used from the picker. |

</div>

<div style={{paddingTop:'24px'}}>

## Events

To add an event to a time picker component, click on the component handle to open the component properties on the right sidebar. Go to the **Events** section and click on **+ Add handler**.

| <div style={{ width:"100px"}}> Event  </div>    | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| OnSelect | Triggers whenever the user selects a time. |
| OnFocus | Triggers whenever the user clicks inside the time picker. |
| OnBlur | Triggers whenever the user clicks outside the time picker. |

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Disabled Dates              |              |  |
| Custom Rules              |            |  |
| Make as mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

## Additional Actions

| <div style={{ width:"100px"}}> Property </div>    | <div style={{ width:"100px"}}> Description  </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:-------------|:------------------------------------------------------------|:------------|
| isLoading  | Indicates if the Time Picker component is loading. | Accessible dynamically with JS (for e.g., `{{components.time_picker.isLoading}}`). |
| isVisible  | Indicates if the Time Picker component is Visible. | Accessible dynamically with JS (for e.g., `{{components.time_picker.isVisible}}`). |
| isDisabled  | Indicates if the Time Picker component is Disabled. | Accessible dynamically with JS (for e.g., `{{components.time_picker.isDisabled}}`). |

### Tooltip

A **Tooltip** is commonly used to provide additional information about an element. This information becomes visible when the user hovers the mouse pointer over the respective component.

In the Time Picker under **Tooltip**, you can enter some value  and the component will show the specified value as a tooltip when it is hovered over.

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile  | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

<div style={{paddingTop:'24px'}}>

## Style

Style guide goes here

## Exposed Variables

| Variables | Description | How To Access |
|:---------|:-----------|:-------------|
| <div style={{ width:"100px"}}> value </div> | This component holds the value entered in the time picker. | Access the value dynamically using JS. (for e.g., `{{components.time_picker.value}}`) |
| isValid  | Indicates if the input meets validation criteria. | Accessible dynamically with JS (for e.g., `{{components.time_picker.isValid}}).` |
| isMandatory  | Indicates if the component is Mandatory. | Accessible dynamically with JS (for e.g., `{{components.time_picker.isMandatory}}`). |

</div>

## Component Specific Actions (CSA)

Following actions of the **Time Picker** component can be controlled using Component-Specific Actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :-------------- | :---------- | :------------ |
| clearValue( )     | Clears the value of the time picker.    | Employ a RunJS query (for e.g.,  <br/> `await components.time_picker.setText('this is input text')`) or trigger it using an event. |
| clear( )        | Clears the entered value in the time picker.      | Employ a RunJS query (for e.g.,  <br/> `await components.time_picker.clear()`) or trigger it using an event. |
| setValue( )     | Sets the value on the time picker.   | Employ a RunJS query (for e.g.,  <br/> `await components.time_picker.setValue()`) or trigger it using an event. |
| setTime( )      | Sets time in the time picker component. | Employ a RunJS query (for e.g.,  <br/> `await components.time_picker.setTime()`) or trigger it using an event. |
| setValueinTimeStamp() | Sets the value in timestamp of the time picker. | Employ a RunJS query (for e.g.,`await components.time_picker.setValueinTimeStamp()`) or trigger it using an event. |
| setMinTime( )   | Set the minimum time in the time picker.	| Employ a RunJS query (for e.g.,`await components.time_picker.setMinTime()`) or trigger it using an event. |
| setMaxTime( )   | Set the maximum time in the time picker.	 | Employ a RunJS query (for e.g.,`await components.time_picker.setMaxTime()`) or trigger it using an event. |
| setTimezone( )   | Sets the setTimezone of the time picker.	 | Employ a RunJS query (for e.g.,`await components.time_picker.setTimezone( )`) or trigger it using an event. |
| setLoading( )   | Sets the loading state of the time picker.	 | Employ a RunJS query (for e.g.,`await components.time_picker.setLoading(true)`) or trigger it using an event. |
| setVisibility( )   | Sets the visibility state of the time picker.	 | Employ a RunJS query (for e.g.,`await components.time_picker.setVisibility(true)`) or trigger it using an event. |
| setDisable( )   | Disables the time picker.	 | Employ a RunJS query (for e.g.,`await components.time_picker.setDisable(true)`) or trigger it using an event. |
| setFocus( )   | Sets the focus of the cursor on the time picker. | Employ a RunJS query (for e.g.,`await components.time_picker.setLoading(true)`) or trigger it using an event. |
| setBlur( )   | Removes the focus of the cursor from the time picker. | Employ a RunJS query (for e.g.,`await components.time_picker.setBlur(true)`) or trigger it using an event. |