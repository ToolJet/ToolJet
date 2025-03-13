---
id: text-area
title: Text Area
---

The **Text Area** component allows users to enter text in an input field. It is generally preferred when multiple sentences are expected. 

All configuration options for the **Text Area** component are as follows:

## Properties

|  Property    |  Description  | Expected Value |
|:-------------|:--------------|:---------------|
| Label | Text to display as the label for the field. | String (for e.g., `This is a Text Area`). |
| Default value| Used to set initial value in text area on load. | String (for e.g., `Hello, John Doe. Welcome to ToolJet!`). |
| Placeholder  | Provides a hint for the expected value. It disappears once the user interacts with the component. | String (for e.g., `Type Your Name Here`). |

## Events

|    Property    |                       Description                            |
|:---------------|:-------------------------------------------------------------|
| On focus       | Triggers whenever the user clicks inside the text area.      |
| On blur        | Triggers whenever the user clicks outside the text area.     |
| On change      | Triggers whenever the user types something in the text area. |

## Component Specific Actions (CSA)

Following actions of component can be controlled using the Component Specific Actions(CSA), which can be triggered by an event or by the given RunJS query:

|  <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> |  How To Access |
| :------------ | :---------- | :------------ |
| setText( )      | Sets the value of the input field.    | `components.textarea1.setText('Hello!')` |
| clear( )        | Clears the entered text in the input field.      | `components.textarea1.clear()` |

## Exposed Variables

Following exposed variables can be dynamically accessed using the given JS query:

| Variables | Description | How To Access |
|:---------|:-----------|:-------------|
|  value | This component holds the value entered in the text area. | `{{components.textarea1.value}}` |
| isValid  | Indicates if the input meets validation criteria. | `{{components.textarea1.isValid}})` |
| isMandatory  | Indicates if the component is Mandatory. | `{{components.textarea1.isMandatory}}` |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the **General** accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

## Additional Actions

|  Action  | Description  | Configuration Options  |
|:---------|:-------------|:-----------------------|
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Validation

|  <div style={{ width:"120px"}}> Validation Option </div> |  <div style={{ width:"200px"}}> Description </div> |  Expected Value |
|:-------------------|:-------------|:----------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Regex              | Regular Expression to validate the input.             | Regular Expression Pattern (for e.g., `^\d{3}-\d{2}-\d{4}$`). |
| Min length         | Sets the minimum number of characters allowed.                | Integer (for e.g., `6` for a minimum of 6 characters). |
| Max length         | Sets the maximum number of characters allowed.                | Integer (for e.g., `12` for a maximum of 12 characters).|
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (for e.g., `{{components.textarea1.value<5&&"Value needs to be more than 5"}}`).           |

To add regex inside `Custom Validation`, you can use the below format: 

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**: `{{(/^\d{1,10}$/.test(components.textarea1.value)) ? '' : 'Error message';}}`

## Devices

|  Devices |  Description | Expected Value |
| :----------- | :----------- | :------------ |
| Show on desktop  | Makes the component visible in desktop view.  | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile  | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

|  Style  |  Description  | Default Value  |
|:------ |:----------| :-----------|
| Border radius | Use this property to modify the border radius of the date-picker. The field expects only numerical value from `1` to `100`. | By default, its value is set to `0`. |
