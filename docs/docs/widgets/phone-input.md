---
id: phone-input
title: Phone Input
---

The **Phone Input** component allows users to enter and validate phone numbers. It can be used as a standalone component or in form fields. In this document, we'll go through all the configuration options for the **Phone Input** component.

<div style={{paddingTop:'24px'}}>

## Properties
| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the field.           | String (e.g., `Email`).         |
| Placeholder   | A hint displayed to guide the user on what to enter.  | String (e.g., `Enter your phone`).          |
| Default Value | The default value that the component will hold when the app is loaded. | String (e.g., `Default Text`). |
| Default Country | The default country code that the component will use when the app is loaded. You can set a static country or bind it dynamically using the `fx` button. | String (e.g., `United States`). |
| Enable country change | Allows users to select and change the country code manually from a dropdown in the phone input field. If disabled, the default country remains fixed. You can also bind it dynamically using the `fx` button.| Boolean (e.g., `(true) `). |

</div>

<div style={{paddingTop:'24px'}}>

## Events

| Event            | Description  | 
|:-----------------|:---------------------------------------------|
| On change    | Triggers whenever the user types something in the text input.                                 |
| On enter pressed | Triggers whenever the user presses the enter key on the keyboard after entering text in the Text Input component. |
| On focus     | Triggers whenever the user clicks inside the text input field.                                |
| On blur      | Triggers whenever the user clicks outside the text input field.                               |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

Following actions of component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setValue()      | Sets the value of the phone input field.    | Employ a RunJS query (for e.g.,  <br/> `await components.phoneinput1.setValue(1)`) or trigger it using an event. |
| clear()        | Clears the entered text in the input field.      | Employ a RunJS query (for e.g.,  <br/> `await components.phoneinput1.clear()`) or trigger it using an event. |
| setFocus()     | Sets the focus of the cursor on the input field.   | Employ a RunJS query (for e.g.,  <br/> `await components.phoneinput1.setFocus()`) or trigger it using an event. |
| setBlur()      | Removes the focus of the cursor from the input field. | Employ a RunJS query (for e.g.,  <br/> `await components.phoneinput1.setBlur()`) or trigger it using an event. |
| setVisibility()| Sets the visibility of the component.            | Employ a RunJS query (for e.g.,  <br/> `await components.phoneinput1.setVisibility(false)`) or trigger it using an event. |
| setLoading()   | Sets the loading state of the component.         | Employ a RunJS query (for e.g.,  <br/> `await components.phoneinput1.setLoading(true)`) or trigger it using an event. |
| setDisable()   | Disables the component.                           | Employ a RunJS query (for e.g., <br/> `await components.phoneinput1.setDisable(true)`) or trigger it using an event. |

:::info
Check the **component specific actions** available for this component **[here](/docs/actions/control-component)**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| Variable | Description | How To Access |
|:--------|:-----------|:------------|
| <div style={{ width:"100px"}}> value </div> | Holds the value entered by the user in the component. | Accessible dynamically with JS (for e.g., `{{components.phoneinput1.value}}`).|
| <div style={{ width:"100px"}}> label </div> | Holds the value of the component's label. | Accessible dynamically with JS (for e.g., `{{components.phoneinput1.label}}`).|
| <div style={{ width:"100px"}}> isValid </div> | Indicates if the input meets validation criteria. | Accessible dynamically with JS (for e.g., `{{components.phoneinput1.isValid}}`).|
| <div style={{ width:"100px"}}> isMandatory </div> | Indicates if the field is required. | Accessible dynamically with JS (for e.g., `{{components.phoneinput1.isMandatory}}`).|
| <div style={{ width:"100px"}}> isLoading </div> | Indicates if the component is loading. | Accessible dynamically with JS (for e.g., `{{components.phoneinput1.isLoading}}`).|
| <div style={{ width:"100px"}}> isVisible </div> | Indicates if the component is visible. | Accessible dynamically with JS (for e.g., `{{components.phoneinput1.isVisible}}`).|
| <div style={{ width:"100px"}}> isDisabled </div> | Indicates if the component is disabled. | Accessible dynamically with JS (for e.g., `{{components.phoneinput1.isDisabled}}`).|
| <div style={{ width:"100px"}}> country </div> | Holds the selected country in the phone input component. | Accessible dynamically with JS (for e.g., `{{components.phoneinput1.country}}`).|
| <div style={{ width:"100px"}}> countryCode </div> | Holds the selected country’s dial code. | Accessible dynamically with JS (for e.g., `{{components.phoneinput1.countryCode}}`).|
| <div style={{ width:"100px"}}> setCountryCode  </div> | Function to set the country code programmatically. | Accessible dynamically with JS (for e.g., `{{components.phoneinput1.setCountryCode("+91")}}`).|

</div>

<div style={{paddingTop:'24px'}}>

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Regex              | Regular Expression to validate the input.             | Regular Expression Pattern (e.g., `^[a-zA-Z0-9_ -]{3,16}$`). |
| Min length         | Sets the minimum number of characters allowed.                | Integer (e.g., `6` for a minimum of 6 characters). |
| Max length         | Sets the maximum number of characters allowed.                | Integer (e.g., `12` for a maximum of 12 characters).|
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{components.phoneinput1.value<5&&"Value needs to be more than 5"}}`).           |

To add regex inside `Custom Validation`, you can use the below format: 

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**: `{{(/^\d{1,10}$/.test(components.phoneinput1.value)) ? '' : 'Error message';}}`

</div>

<div style={{paddingTop:'24px'}}>

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress.    | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility.                                                  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component.                                              | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display.                                 | String (e.g., `Enter your name here.` ).                       |

</div>

<div style={{paddingTop:'24px'}}>

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

---

# Styles 

<div style={{paddingTop:'24px'}}>

## Label

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Text     | Sets the color of the component's label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Alignment      | Sets the position of the label and input field. | Click on the toggle options or click on **fx** to input code that programmatically returns an alignment value - `side` or `top`. |
| Width          | Sets the width of the input field. | Keep the `Auto width` option for standard width or deselect it to modify the width using the slider or through code entry in **fx** that returns a numeric value.  |

</div>

<div style={{paddingTop:'24px'}}>

## Field

| <div style={{ width:"100px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background        | Sets the background color of the component.                                                   | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Border    | Sets the border color of the component.                                                       | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Text      | Sets the text color of the text entered in the component.                                     | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Error text | Sets the text color of validation message that displays.                                      | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Icon            | Allows you to select an icon for the component.                                               | Enable the icon visibility, select icon and icon color. Alternatively, you can programmatically set it using **fx**.                                     |
| Border radius   | Modifies the border radius of the component.                                                  | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value.           |
| Box shadow      | Sets the box shadow properties of the component.                                              | Select the box shadow color and adjust the related properties or set it programmatically using **fx**.                                            |

</div>

<div style={{paddingTop:'24px'}}>

## Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.

</div>