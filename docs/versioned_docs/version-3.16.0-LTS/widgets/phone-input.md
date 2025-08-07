---
id: phone-input
title: Phone Input
---

The **Phone Input** component allows users to enter and validate phone numbers. It can be used as a standalone input or within **Form** where phone number collection is required. The component supports international formats, auto-formatting, and validation to ensure accurate data entry. In this document, we'll go through all the configuration options for the **Phone Input** component.

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the field.           | String (e.g., `Contact Number`).         |
| Placeholder   | A hint displayed to guide the user on what to enter.  | String (e.g., `Please enter your contact number`).          |
| Default Value | The default value that the component will hold when the app is loaded. | String (e.g., `(999) 999-9999`). |
| Default Country | Sets the default country code to be used. |  Select the default country from the dropdown or update it dynamically using **fx**. |
| Enable country change | Allows the user to select a different country code from the dropdown. If disabled, the user can enter only the default country code. | Enable or disable it using the toggle button or use **fx** to update it dynamically. |

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
| setValue( )     | Sets the value of the **Currency Input** field.       | `components.phoneinput1.setValue(value)` |
| clear( )        | Clears the input field.                               | `components.phoneinput1.clear()`         |
| setFocus( )     | Sets the focus of the cursor on the input field.      | `components.phoneinput1.setFocus()`      |
| setBlur( )      | Removes focus from the input field.                   | `components.phoneinput1.setBlur()`       |
| setVisibility( )| Sets the visibility of the component.                 | `components.phoneinput1.setVisibility(false)` |
| setLoading( )   | Sets the loading state of the component.              | `components.phoneinput1.setLoading(true)` |
| setDisable( )   | Disables the component.                               | `components.phoneinput1.setDisable(true)` |
| setCountryCode ( ) | Programmatically sets the country code.            | `{{components.phoneinput1.setCountryCode("US")}}` |


## Exposed Variables

| Variable | <div style={{ width:"250px"}}> Description </div> | How To Access |
|:--------|:-----------|:------------|
|  value | Holds the value entered by the user in the component. | `{{components.phoneinput1.value}}` |
|  label | Holds the value of the component's label. | `{{components.phoneinput1.label}}` |
|  isValid | Indicates if the input meets validation criteria. | `{{components.phoneinput1.isValid}}` |
|  isMandatory | Indicates if the field is required. | `{{components.phoneinput1.isMandatory}}` |
|  isLoading | Indicates if the component is loading. | `{{components.phoneinput1.isLoading}}` |
|  isVisible | Indicates if the component is visible. | `{{components.phoneinput1.isVisible}}` |
|  isDisabled | Indicates if the component is disabled. | `{{components.phoneinput1.isDisabled}}` |
|  country | Holds the selected country in the phone input component. | `{{components.phoneinput1.country}}` |
|  countryCode | Holds the selected country’s dial code. | `{{components.phoneinput1.countryCode}}` |
|  formattedValue | The value with the exact format shown in the phone input. | `{{components.phoneinput1.formattedValue}}` |

## Validation

| <div style={{ width:"200px"}}> Validation Option </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{width: "500px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Regex              | Regular Expression to validate the input.                     | Regular Expression Pattern (e.g., `^\d{1,10}$` ). |
| Min length         | Sets the minimum number of characters allowed.                | Integer (e.g., `10` for a minimum of 10 characters). |
| Max length         | Sets the maximum number of characters allowed.                | Integer (e.g., `10` for a maximum of 10 characters).|
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{components.phoneinput1.value.length === 10&&"Phone number must be 10 digits"}}`).           |

To add regex inside `Custom Validation`, you can use the below format: 

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**: `{{(/^\d{1,10}$/.test(components.phoneinput1.value)) ? '' : 'Error message';}}`


## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress.    | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Visibility         | Controls component visibility.                                                  | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Disable            | Enables or disables the component.                                              | Enable/disable the toggle button or dynamically configure the value by clicking **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a display string.                                 | String (e.g., `Enter the contact number` ).                       |

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