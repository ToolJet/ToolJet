---
id: text-input
title: Text Input
---

The **Text Input** component allows users to enter a single line of text. It can be used as a standalone component or in Form fields. In this document, we'll go through all the configuration options for the **Text Input** component.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div>                      | <div style={{width: "200px"}}> Expected Value </div> |
| :--------------------------------------------- | :--------------------------------------------------------------------- | :--------------------------------------------------- |
| Label                                          | Text to display as the label for the field.                            | String (e.g., `Enter Your Name`).                    |
| Placeholder                                    | A hint displayed to guide the user on what to enter.                   | String (e.g., `John Doe`).                           |
| Default Value                                  | The default value that the component will hold when the app is loaded. | String (e.g., `Default Text`).                       |

## Events

| Event            | Description                                                                                                       |
| :--------------- | :---------------------------------------------------------------------------------------------------------------- |
| On change        | Triggers whenever the user types something in the text input.                                                     |
| On enter pressed | Triggers whenever the user presses the enter key on the keyboard after entering text in the Text Input component. |
| On focus         | Triggers whenever the user clicks inside the text input field.                                                    |
| On blur          | Triggers whenever the user clicks outside the text input field.                                                   |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Action </div> |   <div style={{ width:"135px"}}> Description </div>   |  <div style={{width: "200px"}}> How To Access </div>  |
| :------------------------------------------- | :---------------------------------------------------- | :---------------------------------------------------- |
| setText()                                    | Sets the value of the input field.                    | `components.textinput1.setText('this is input text')` |
| clear()                                      | Clears the entered text in the input field.           | `components.textinput1.clear()`                       |
| setFocus()                                   | Sets the focus of the cursor on the input field.      | `components.textinput1.setFocus()`                    |
| setBlur()                                    | Removes the focus of the cursor from the input field. | `components.textinput1.setBlur()`                     |
| setVisibility()                              | Sets the visibility of the component.                 | `components.textinput1.setVisibility(false)`          |
| setLoading()                                 | Sets the loading state of the component.              | `components.textinput1.setLoading(true)`              |
| setDisable()                                 | Disables the component.                               | `components.textinput1.setDisable(true)`              |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | Description | How To Access |
| :----------- | :-----------| :------------ |
| value        | Holds the value entered by the user in the component. | `{{components.textinput1.value}}`       |
| label        | Holds the value of the component's label.             | `{{components.textinput1.label}}`       |
| isValid      | Indicates if the input meets validation criteria.     | `{{components.textinput1.isValid}}`     |
| isMandatory  | Indicates if the field is required.                   | `{{components.textinput1.isMandatory}}` |
| isLoading    | Indicates if the component is loading.                | `{{components.textinput1.isLoading}}`   |
| isVisible    | Indicates if the component is visible.                | `{{components.textinput1.isVisible}}`   |
| isDisabled   | Indicates if the component is disabled.               | `{{components.textinput1.isDisabled}}`  |

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :------------------------------------------------------ | :------------------------------------------------ | :--------------------------------------------------- |
| Make this field mandatory | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Regex | Regular Expression to validate the input. | Regular Expression Pattern (e.g., `^\d{3}-\d{2}-\d{4}$`). |
| Min length | Sets the minimum number of characters allowed. | Integer (e.g., `6` for a minimum of 6 characters). |
| Max length | Sets the maximum number of characters allowed. | Integer (e.g., `12` for a maximum of 12 characters). |
| Custom validation | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{components.textinput1.value<5&&"Value needs to be more than 5"}}`). |

To add regex inside `Custom Validation`, you can use the below format:

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**: `{{(/^\d{1,10}$/.test(components.textinput1.value)) ? '' : 'Error message';}}`

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :-------------------------------------------------| :-----------------------------------------------------------|
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String (e.g., `Enter your name here.` ). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :----------------------------------------------------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :-----------------------------------------------------------|
| Text | Sets the color of the component's label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Alignment | Sets the position of the label and input field. | Click on the toggle options or click on **fx** to input code that programmatically returns an alignment value - **side** or **top**. |
| Width | Sets the width of the input field. | Enable **Auto width** to use the standard width automatically. Disable it to manually adjust the width using the slider or by entering a numeric value via **fx**. You can also choose whether the width is calculated relative to the **Container** or relative to the **Field**. |

### Field

| <div style={{ width:"100px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--------------------------------------------------- | :------------------------------------------------ | :-----------------------------------------------------------|
| Background | Sets the background color of the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border | Sets the border color of the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Text | Sets the text color of the text entered in the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Error text | Sets the text color of validation message that displays.  | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Icon | Allows you to select an icon for the component. | Enable the icon visibility, select icon and icon color. Alternatively, you can programmatically set it using **fx**. |
| Border radius | Modifies the border radius of the component. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |

### Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.
