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
| setValue( )     | Sets the value of the **Currency Input** field.       | `components.currencyinput1.setValue(value)` |\
| clear( )        | Clears the input field.                               | `components.currencyinput1.clear()`         |
| setFocus( )     | Sets the focus of the cursor on the input field.      | `components.currencyinput1.setFocus()`      |
| setBlur( )      | Removes focus from the input field.                    . | `components.currencyinput1.setBlur()`       |
| setVisibility( )| Sets the visibility of the component.                 | `components.currencyinput1.setVisibility(false)` |
| setLoading( )   | Sets the loading state of the component.              | `components.currencyinput1.setLoading(true)` |
| setDisable( )   | Disables the component.                               | `components.currencyinput1.setDisable(true)` |
| setCountryCode ( ) | Programmatically sets the country code.            | `{{components.currencyinput1.setCountryCode("US")}}` |
