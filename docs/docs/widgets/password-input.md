---
id: password-input
title: Password Input
---
# Password Input

The Password Input component allows users to enter passwords securely. In this component, passwords are concealed, displaying each character as an asterisk to ensure privacy. In this document, we'll go through all the configuration options for the **Password Input** component. 

## Properties
| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the field.           | String (e.g., "Enter Your Password").         |
| Placeholder   | A hint displayed to guide the user on what to enter.  | String (e.g., "SecurePassword123").          |
| Default Value | The default value that the component will hold when the app is loaded. | String (e.g., "Default Text"). |


## Events

**On change** <br/>
Triggers whenever the user types something in the input field.

**On enter pressed** <br/>
Triggers whenever the user presses the enter button on keyboard after entering some text in the input field.

**On focus** <br/>
Triggers whenever the user clicks inside the input field.

**On blur** <br/>
Triggers whenever the user clicks outside the input field.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Regex              | Regular Expression to validate the input.             | Regular Expression Pattern (e.g., `^\d{3}-\d{2}-\d{4}$`). |
| Min Length         | Sets the minimum number of characters allowed.                | Integer (e.g., `6` for a minimum of 6 characters). |
| Max Length         | Sets the maximum number of characters allowed.                | Integer (e.g., `12` for a maximum of 12 characters).|
| Custom Validation  | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{components.passwordinput1.value<5&&"Value needs to be more than 5"}}`).           |
| Mandatory Field    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |


## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Visibility         | Controls component visibility. Toggle or set dynamically.                                                 | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Disable            | Enables or disables the component. Toggle or set dynamically.                                             | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display.                                 | String (e.g., `Enter your name here.` ).                       |

## Devices

**Show on desktop**

Makes the component visible in desktop view. You can set it with the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression.

**Show on mobile**

Makes the component visible in mobile view. You can set it with the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression.

---

# Styles 

## Label

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Text color     | Sets the color of the component's label. | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Alignment      | Sets the position of the label and input field. | Click on the toggle options or click on `fx` to input code that programmatically returns an alignment value - `side` or `top`. |
| Width          | Sets the width of the input field. | Keep the `Auto width` option for standard width or deselect it to modify the width using the slider or through code entry in fx for a numeric value return. |

## Field

| <div style={{ width:"100px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background        | Sets the background color of the component.                                                   | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Border color    | Sets the border color of the component.                                                       | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Text color      | Sets the text color of the text entered in the component.                                     | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Error text color| Sets the text color of validation message that displays.                                      | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Icon            | Allows you to select an icon for the component.                                               | Enable the icon visibility and select which icon you want to display                                     |
| Icon color      | Sets the icon color of the component.                                                         | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Border radius   | Modifies the border radius of the component.                                                  | Enter a number or click on `fx` and enter a code that programmatically returns a numeric value.           |
| Box shadow      | Sets the box shadow properties of the component.                                              | Select the box shadow color and adjust the related properties.                                            |


## Container

**Padding** <br/>
Allows you to pick between `Default` or none as the padding setting for the component.

:::info
Check the **component specific actions** available for this component **[here](/docs/actions/control-component)**.
:::


## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|: ---------- | :---------- | :------------ |
| value       | Holds the value entered by the user in the component. | Accessible dynamically with JS (for e.g., `{{components.passwordinput1.value}}`). |
| isValid     | Indicates if the input meets validation criteria. | Accessible dynamically with JS (for e.g., `{{components.passwordinput1.isValid}}`). |
| isMandatory | Indicates if the field is required. | Accessible dynamically with JS (for e.g., `{{components.passwordinput1.isMandatory}}`). |
| isLoading   | Indicates if the component is loading. | Accessible dynamically with JS (for e.g., `{{components.passwordinput1.isLoading}}`). |
| isVisible   | Indicates if the component is visible. | Accessible dynamically with JS (for e.g., `{{components.passwordinput1.isVisible}}`). |
| isDisabled  | Indicates if the component is disabled. | Accessible dynamically with JS (for e.g., `{{components.passwordinput1.isDisabled}}`). |


## Component specific actions (CSA)

Following actions of component can be controlled using the component specific actions(CSA):


| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setText()      | Sets the value of the input field.    | Employ a RunJS query (for e.g.,  <br/> `await components.passwordinput1.setText('this is input text')`). |
| clear()        | Clears the entered text in the input field.      | Employ a RunJS query (for e.g.,  <br/> `await components.passwordinput1.clear()`). |
| setFocus()     | Sets the focus of the cursor on the input field.   | Employ a RunJS query (for e.g.,  <br/> `await components.passwordinput1.setFocus()`). |
| setBlur()      | Removes the focus of the cursor from the input field. | Employ a RunJS query (for e.g.,  <br/> `await components.passwordinput1.setBlur()`). |
| setVisibility()| Sets the visibility of the component.            | Employ a RunJS query (for e.g.,  <br/> `await components.passwordinput1.setVisibility(false)`). |
| setLoading()   | Sets the loading state of the component.         | Employ a RunJS query (for e.g.,  <br/> `await components.passwordinput1.setLoading(true)`). |
| setDisable()   | Disables the component.                           | Employ a RunJS query (for e.g., <br/> `await components.passwordinput1.setDisable(true)`). |