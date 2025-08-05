---
id: email-input
title: Email Input
---

The **Email Input** component in ToolJet allows users to enter and validate email addresses within your app. It provides built-in validation to ensure the input matches a valid email format, helping you collect reliable user data effortlessly.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the field.           | String (e.g., `Email ID`).         |
| Placeholder   | A hint displayed to guide the user on what to enter.  | String (e.g., `Please enter your email address`).          |
| Default Value | The default value that the component will hold when the app is loaded. | String (e.g., `john@example.com`). |

## Events

| Event            | Description                                                       | 
|:-----------------|:------------------------------------------------------------------|
| On change        | Triggers when the user types in the input field.    |
| On enter pressed | Triggers whenever the user presses the enter key on the keyboard. |
| On focus         | Triggers whenever the user clicks inside the input field.         |
| On blur          | Triggers whenever the user clicks outside the input field.        |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"170px"}}> Description </div> | <div style={{width: "200px"}}> RunJS Query </div>|
| :------------ | :---------- | :------------ |
| setText( )      | Sets the value of the **Email Input** field.          | `components.emailinput1.setText(text)` |
| clear( )        | Clears the input field.                               | `components.emailinput1.clear()`         |
| setFocus( )     | Sets the focus of the cursor on the input field.      | `components.emailinput1.setFocus()`      |
| setBlur( )      | Removes focus from the input field.                   | `components.emailinput1.setBlur()`       |
| setVisibility( )| Sets the visibility of the component.                 | `components.emailinput1.setVisibility(false)` |
| setLoading( )   | Sets the loading state of the component.              | `components.emailinput1.setLoading(true)` |
| setDisable( )   | Disables the component.                               | `components.emailinput1.setDisable(true)` |

## Exposed Variables

| Variable | <div style={{ width:"250px"}}> Description </div> | How To Access |
|:--------|:-----------|:------------|
|  value | Holds the value entered by the user in the component. | `{{components.emailinput1.value}}` |
|  label | Holds the value of the component's label. | `{{components.emailinput1.label}}` |
|  isValid | Indicates if the input meets validation criteria. | `{{components.emailinput1.isValid}}` |
|  isMandatory | Indicates if the field is required. | `{{components.emailinput1.isMandatory}}` |
|  isLoading | Indicates if the component is loading. | `{{components.emailinput1.isLoading}}` |
|  isVisible | Indicates if the component is visible. | `{{components.emailinput1.isVisible}}` |
|  isDisabled | Indicates if the component is disabled. | `{{components.emailinput1.isDisabled}}` |

## Validation

| <div style={{ width:"200px"}}> Validation Option </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{width: "500px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Regex              | Regular Expression to validate the input.                     | Regular Expression Pattern (e.g., `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` ). |
| Min length         | Sets the minimum number of characters allowed.                | Integer (e.g., `10` for a minimum of 10 characters). |
| Max length         | Sets the maximum number of characters allowed.                | Integer (e.g., `10` for a maximum of 10 characters).|
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{ !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(components.emailinput1.value) && "Please enter a valid email address" }}`).           |

To add regex inside `Custom Validation`, you can use the below format: 

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**: `{{ !/^[^\s@]+@tooljet\.com$/.test(components.emailinput1.value) ? '' : "Please enter a valid tooljet.com email address" }}`

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress.    | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Visibility         | Controls component visibility.                                                  | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Disable            | Enables or disables the component.                                              | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a display string.                                 | String (e.g., `Enter the email address` ).                       |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |


## Styles

### Label

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Text     | Sets the color of the component's label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Alignment      | Sets the position of the label and input field. | Select either `side` or `top` or click on **fx** to input code that programmatically returns an alignment value - `side` or `top`. |
| Width          | Sets the width of the input field. | Keep the `Auto width` option for standard width or deselect it to modify the width using the slider or through code entry in **fx** that returns a numeric value.  |

### Field

| <div style={{ width:"100px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background  | Sets the background color of the component.  | Select the color or click on **fx** and input code that programmatically returns a Hex color code.  |
| Border  | Sets the border color of the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code.  |
| Text  | Sets the text color of the text entered in the component.  | Select the color or click on **fx** and input code that programmatically returns a hex color code. |
| Error text | Sets the text color of the validation message that is displayed.  | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Icon | Allows you to select an icon for the component.  | Enable the icon visibility, and select the icon and icon color. Alternatively, set it programmatically using **fx**. |
| Border radius   | Modifies the border radius of the component.  | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value.  |
| Box shadow      | Sets the box shadow properties of the component.  | Select the box shadow color and adjust the related properties or set it programmatically using **fx**.  |

### Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.