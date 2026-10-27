---
id: toggle-switch-v2
title: Toggle Switch
---

The **Toggle Switch** component can be used for binary choices, such as turning a feature on/off or enabling/disabling a setting.

<div style={{paddingTop:'24px'}}>

## Properties

### Data

| Property       | Description                                             | Expected Value                                                             |
| :------------- | :------------------------------------------------------ | :------------------------------------------------------------------------- |
| Label          | The text to be used as the label for the toggle switch. | String (e.g., `Enable notifications`).                                     |
| Default state  | Sets the default state (On/Off) when the app is loaded. | Select **On** or **Off**, or click **fx** and enter a logical expression.   |

</div>

<div style={{paddingTop:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div>                    |
| :------------------------------------------ | :------------------------------------------------------------------- |
| On change                                   | Triggers when the toggle switch is turned on or off by the user, or with the `toggle()` CSA. |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

Following actions of Toggle switch component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div>                                                                | <div style={{ width:"135px"}}> How To Access </div>                                                             |
| :------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| setValue                                     | Sets the value of the toggle switch. Doesn't trigger the **On change** event.                                     | Employ a RunJS query (e.g., `await components.toggleswitch1.setValue(true)`) or trigger it using an event.      |
| setLoading                                   | Toggles the loading state of the toggle switch.                                                                  | Employ a RunJS query (e.g., `await components.toggleswitch1.setLoading(true)`) or trigger it using an event.    |
| setVisibility                                | Changes the visibility of the toggle switch.                                                                     | Employ a RunJS query (e.g., `await components.toggleswitch1.setVisibility(true)`) or trigger it using an event. |
| setDisable                                   | Disables or enables the toggle switch.                                                                           | Employ a RunJS query (e.g., `await components.toggleswitch1.setDisable(true)`) or trigger it using an event.    |
| toggle                                       | Toggles the current state of the toggle switch and triggers the **On change** event.                              | Employ a RunJS query (e.g., `await components.toggleswitch1.toggle()`) or trigger it using an event.            |

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div>                                        | <div style={{ width:"135px"}}> How To Access </div>                                |
| :---------------------------------------------- | :--------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| value                                           | Holds the boolean value `true` if the toggle switch is checked and `false` if unchecked. | Accessible dynamically with JS (e.g., `{{components.toggleswitch1.value}}`).       |
| label                                           | The text label of the toggle switch.                                                     | Accessible dynamically with JS (e.g., `{{components.toggleswitch1.label}}`).       |
| isValid                                         | Indicates if the toggle switch state is valid.                                           | Accessible dynamically with JS (e.g., `{{components.toggleswitch1.isValid}}`).     |
| isMandatory                                     | Indicates if the toggle switch is mandatory.                                             | Accessible dynamically with JS (e.g., `{{components.toggleswitch1.isMandatory}}`). |
| isLoading                                       | Indicates if the toggle switch is in a loading state.                                    | Accessible dynamically with JS (e.g., `{{components.toggleswitch1.isLoading}}`).   |
| isVisible                                       | Indicates if the toggle switch is visible.                                               | Accessible dynamically with JS (e.g., `{{components.toggleswitch1.isVisible}}`).   |
| isDisabled                                      | Indicates if the toggle switch is disabled.                                              | Accessible dynamically with JS (e.g., `{{components.toggleswitch1.isDisabled}}`).  |

</div>

<div style={{paddingTop:'24px'}}>

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div>                  | <div style={{width: "200px"}}> Expected Value </div>                                                                         |
| :------------------------------------------------------ | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Make this field mandatory                               | Displays a 'Field cannot be empty' message if the switch is off. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Custom validation                                       | Specifies a validation error message for specific conditions.      | Logical Expression (e.g., `{{components.toggleswitch1.value === false &&"Value needs to be checked"}}`).                     |

To add regex inside `Custom Validation`, you can use the below format:

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**: `{{(/^\d{1,10}$/.test(components.textinput1.value)) ? '' : 'Error message';}}`

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                                                                  | <div style={{ width:"250px"}}> Configuration Options </div>                                                                  |
| :------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Loading state                                | Enables a loading spinner, often used with the isLoading property to indicate progress. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility                                   | Controls component visibility. Toggle or set dynamically.                                                          | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable                                      | Enables or disables the component. Toggle or set dynamically.                                                      | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Supports **Plain text**, **Markdown**, and **HTML** formats. | String (e.g., `Are you a registered user?` ).                                                                                |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Makes the component visible in desktop view.      | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile                                 | Makes the component visible in mobile view.       | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

# Styles

## Label

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>                                                                        |
| :--------------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| Text color                                           | Sets the color of the component's label.          | Select the color or click on **fx** and input code that programmatically returns a Hex color code.                                 |
| Alignment                                            | Sets the position of the label and input field.   | Click on the toggle options or click on **fx** to input code that programmatically returns an alignment value - `left` or `right`. |

## Switch

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div>              | <div style={{ width:"250px"}}> Configuration Options </div>                                            |
| :--------------------------------------------------- | :------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| Border color                                         | Sets the border color of the switch.                           | Select the color or click on **fx** and input code that programmatically returns a Hex color code.     |
| Checked color                                        | Sets the color of the toggle switch when it is checked.        | Select the color or click on **fx** and input code that programmatically returns a Hex color code.     |
| Unchecked color                                      | Sets the color of the toggle switch when it is not checked.    | Select the color or click on **fx** and input code that programmatically returns a Hex color code.     |
| Handle color                                         | Sets the color of the switch handle (knob).                    | Select the color or click on **fx** and input code that programmatically returns a Hex color code.     |
| Box shadow                                           | Sets the box shadow properties of the component.               | Select the box shadow color and adjust the related properties or set it programmatically using **fx**. |
| Padding | Sets the padding around the component. **Default** adds 2px of padding; **None** removes it. | Choose **Default** or **None**. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::

</div>
