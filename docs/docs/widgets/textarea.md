---
id: text-area
title: Textarea
---

The **Textarea** component allows users to enter text in an input field similar to the [Text Input](/docs/widgets/text-input) component. Textarea is generally preferred when we are expecting an input of multiple sentences. In this document, we'll go through all the configuration options for the **Textarea** component.

## Properties

|  Property    |  Description  | Expected Value |
|:-------------|:--------------|:---------------|
| Label | Text to display as the label for the field. | String (for e.g., `Enter Your Address`). |
| Default value| Used to set initial value in text area on load. | String (for e.g., `Nexus Building, Street XYZ, AB, 010101`). |
| Placeholder  | Provides a hint for the expected value. It disappears once the user interacts with the component. | String (for e.g., `Enter Your Address Here`). |

## Events

|  Event      |  Description  |
|:----------- |:----------- |
| On change | Triggers whenever the input value changes. |
| On enter pressed | Triggers whenever the enter key is pressed. |
| On focus  | Triggers whenever the user clicks inside the input field.  |
| On blur   | Triggers whenever the user clicks outside the input field. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

Following actions of component can be controlled using the Component Specific Actions(CSA), which can be triggered by an event or by the given RunJS query:

| <div style={{ width:"100px"}}> Actions  </div>   | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
| :----------- | :----------- |:---------|
| setText | Sets the text for the component.|  `components.textarea1.setText('this is a textarea')` |
| clear | Clears the value from the text area component.| `components.textarea1.clear()`. |
| setVisibility( )   | Sets the visibility state of the text area.	 | `components.textarea1.setVisibility()` |
| setLoading( )   | Sets the loading state of the text area.	 | `components.textarea1.setLoading()` |
| setDisable( )   | Disables the text area.	 | `components.textarea1.setDisable()` |
| setFocus( )   | Sets the focus of the cursor on the text area. | `components.textarea1.setLoading()` |
| setBlur( )   | Removes the focus of the cursor from the text area. | `components.textarea1.setBlur()` |

## Exposed Variables

Following exposed variables can be dynamically accessed using the given JS query:

| Variables | Description | How To Access |
|:---------|:-----------|:-------------|
|  value | This variable holds the value entered in the text area component. | `{{components.textarea1.value}}` |
|  label  | Holds the value of the component's label. | `{{components.textarea1.label}}` |
|  isValid  | Indicates if the input meets validation criteria. |  `{{components.textarea1.isValid}})` |
|  isMandatory  | Indicates if the field is Mandatory. |  `{{components.textarea1.isMandatory}}` |
|  isLoading  | Indicates if the component is loading. | `{{components.textarea1.isLoading}}` |
|  isVisible  | Indicates if the component is visible. | `{{components.textarea1.isVisible}}` |
|  isDisabled  | Indicates if the component is disabled. | `{{components.textarea1.isDisabled}}` |

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Regex | Regular Expression to validate the input.  | Regular Expression Pattern (e.g., `^\d{3}-\d{2}-\d{4}$`). |
| Min length  | Sets the minimum number of characters allowed. | Integer (e.g., `100` for a minimum of 100 characters). |
| Max length  | Sets the maximum number of characters allowed. | Integer (e.g., `500` for a maximum of 500 characters).|
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{components.textarea1.value<5&&"Value needs to be more than 5"}}`).           |

To add regex inside `Custom Validation`, you can use the below format: 

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**: `{{(/^\d{1,10}$/.test(components.textarea1.value)) ? '' : 'Error message';}}`

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Dynamic height | Automatically adjusts the component's height based on its content. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String (e.g., `Enter your name here.` ). |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
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
| Border radius | Controls the roundness of the component's input field. |
| Box shadow | Applies shadow styling to the input field. |
| Padding | Sets the internal spacing between the content and the input field edges. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::
