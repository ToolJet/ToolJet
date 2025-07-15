---
id: textarea
title: Textarea
---

The **Textarea** component allows users to enter text in an input field similar to the [Text Input](/docs/widgets/text-input) component. Textarea is generally preferred when we are expecting an input of multiple sentences. In this document, we'll go through all the configuration options for the **Textarea** component.

## Properties

| <div style={{ width:"100px"}}> Property </div>    | <div style={{ width:"100px"}}> Description  </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:-------------|:------------------------------------------------------------|:------------|
| Label | Text to display as the label for the field. | String |
| Placeholder  | Provides a hint for the expected value. It disappears once the user interacts with the component. | String |
| Default value| Used to set initial value in textarea on load. | String |

## Events

| Event            | Description         |
|:------------------|:---------------------|
| On change    | Triggers whenever the user types something in the input field.                                   |
| On focus     | Triggers whenever the user clicks inside the input field.                                        |
| On blur      | Triggers whenever the user clicks outside the input field.                                       |
| On enter pressed | Triggers whenever the user presses the enter button on the keyboard after entering some text in the input field. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Actions  </div>   | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
| :----------- | :----------- |:---------|
| setText( ) | Sets the text on the text area component via a component-specific action within any event handler.| `components.textarea1.setText()` |
| clear( ) | Clears the value from the text area component via a component-specific action within any event handler.| `components.textarea1.clear()` |
| setFocus( ) | Sets the focus of the cursor on the input field.   | `components.textarea1.setFocus()` |
| setBlur( )  | Removes the focus of the cursor from the input field. | `components.textarea1.setBlur()` |
| setVisibility( )| Sets the visibility of the component. | `components.textarea1.setVisibility(false)` |
| setLoading( ) | Sets the loading state of the component.  | `components.textarea1.setLoading(true)`  |
| setDisable( ) | Disables the component. | `components.textarea1.setDisable(true)` |

## Exposed Variables

| Variables | <div style={{ width:"200px"}}> Description </div> | How To Access |
|:---------|:-----------|:-------------|
| value | This variable holds the value entered in the text area component. | `{{components.textarea1.value}}` |
| label | Holds the value of the component's label. | `{{components.textarea1.label}}` |
| isValid | Indicates if the input meets validation criteria. | `{{components.textarea1.isValid}}` |
| isMandatory | Indicates if the field is required. | `{{components.textarea1.isMandatory}}`|
| isLoading | Indicates if the component is loading. | `{{components.textarea1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.textarea1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.textarea1.isDisabled}}` |

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

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Text     | Sets the color of the component's label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Alignment      | Sets the position of the label and input field. | Click on the toggle options or click on **fx** to input code that programmatically returns an alignment value - `side` or `top`. |
| Width          | Sets the width of the input field. | Keep the `Auto width` option for standard width or deselect it to modify the width using the slider or through code entry in **fx** that returns a numeric value.  |

### Field

| <div style={{ width:"100px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background        | Sets the background color of the component.                                                   | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Border    | Sets the border color of the component.                                                       | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Text      | Sets the text color of the text entered in the component.                                     | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Error text | Sets the text color of validation message that displays.                                      | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Icon            | Allows you to select an icon for the component.                                               | Enable the icon visibility, select icon and icon color. Alternatively, you can programmatically set it using **fx**.                                     |
| Border radius   | Modifies the border radius of the component.                                                  | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value.           |
| Box shadow      | Sets the box shadow properties of the component.                                              | Select the box shadow color and adjust the related properties or set it programmatically using **fx**.                                            |

### Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.
