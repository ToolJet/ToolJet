---
id: currency-input
title: Currency Input
---

The **Currency Input** component allows users to enter currency-formatted values. It’s especially useful for forms and financial applications where numerical values need to be formatted with currency symbols, decimal places, and thousand separators.

This component ensures consistent formatting of monetary values, prevents invalid input, and supports a range of customization options, such as currency type and precision.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|------------------------|------------------------------------------------------|----------------|
| Label                  | Text to display as the label for the field. | String (e.g. `Reimbursement Amount`). |
| Placeholder            | A hint displayed to guide the user on what to enter. | String (e.g. `Enter the amount in USD`). |
| Default value          | The default value that the component will hold when the app is loaded. | Number (e.g. `83.67`). |
| Decimal places         | Number of decimal places to show after the decimal point. | Integer (e.g. `2`). |
| Default Currency       | Sets the currency format to use by default.  | Select the default currency from the dropdown or update it dynamically using **fx**. |
| Enable currency change | Allows the user to select a different currency from a dropdown. If disabled, the user can enter only the default currency. | Enable or disable it using the toggle button or use **fx** to update it dynamically. |

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
| setValue( )     | Sets the value of the **Currency Input** field.       | `components.currencyinput1.setValue(value)` |
| setText( )      | Sets the value of the **Currency Input** field.       | `components.currencyinput1.setText(value)`  |
| clear( )        | Clears the input field.                               | `components.currencyinput1.clear()`         |
| setFocus( )     | Sets the focus of the cursor on the input field.      | `components.currencyinput1.setFocus()`      |
| setBlur( )      | Removes focus from the input field.                    . | `components.currencyinput1.setBlur()`       |
| setVisibility( )| Sets the visibility of the component.                 | `components.currencyinput1.setVisibility(false)` |
| setLoading( )   | Sets the loading state of the component.              | `components.currencyinput1.setLoading(true)` |
| setDisable( )   | Disables the component.                               | `components.currencyinput1.setDisable(true)` |
| setCountryCode ( ) | Programmatically sets the country code.            | `{{components.currencyinput1.setCountryCode("US")}}` |

## Exposed Variables

| Variable | <div style={{ width:"250px"}}> Description </div> | How To Access |
|:--------|:-----------|:------------|
|  value | Holds the value of the component. | `{{components.currencyinput1.value}}`|
|  label | Holds the value of the component's label. | `{{components.currencyinput1.label}}`|
|  isValid  | Indicates if the input meets validation criteria. | `{{components.currencyinput1.isValid}}`|
|  isMandatory | Indicates if the field is required. | `{{components.currencyinput1.isMandatory}}`|
|  isLoading | Indicates if the component is loading. | `{{components.currencyinput1.isLoading}}`|
|  isVisible | Indicates if the component is visible. | `{{components.currencyinput1.isVisible}}`|
|  isDisabled  | Indicates if the component is disabled. | `{{components.currencyinput1.isDisabled}}`|
|  country | Holds the selected country in the currency input component. | `{{components.currencyinput1.country}}`|
|  formattedValue | Holds the currency-formatted value based on the input and selected country. | `{{components.currencyinput1.formattedValue}}`|


## Validation

| <div style={{ width:"200px"}}> Validation Option </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure using **fx**. |
| Regex  | Regular Expression to validate the input. | Regular Expression Pattern (e.g., `^\d+(\.\d{1,2})?$`). |
| Min value | Sets the minimum value allowed.  | Integer (e.g., `99`). |
| Max value | Sets the maximum value allowed.  | Integer (e.g., `1000`).|
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{components.currencyinput1.value<99&&"Value needs to be more than $99"}}`). |

To add regex inside `Custom Validation`, you can use the below format: 

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**: `{{(/^\d+(\.\d{1,2})?$/.test(components.currencyinput1.value)) ? '' : 'Invalid Input';}}`


## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress.    | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Visibility         | Controls component visibility.                                                  | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Disable            | Enables or disables the component.                                              | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a display string.                                 | String (e.g., `Enter the amount in USD` ).                       |

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
