---
id: checkbox
title: Checkbox
---
# Checkbox

The **Checkbox** component allows users to make a binary choice, such as selecting or deselecting an option.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

### Data

| Property       | Description    | Expected Value         |
|:---------------|:---------------|:-----------------------|
| Label          | The text to be used as the label for the checkbox.          | String (e.g., `Select payment preference`).                 |
| Default status | Sets the default status when the app is loaded.                | Toggle the on/off switch or click on `fx` and dynamically set the value. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event </div>     | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On change | On change event is triggered when checkbox input is changed. |
| On check (deprecated) | On check event is triggered when checkbox input is checked. |
| On uncheck (deprecated)| On uncheck event is triggered when checkbox input is unchecked. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

Following actions of Checkbox component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Action  </div>  | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:---------|
| setChecked    | Changes the status of the checkbox component using component-specific action from within any event handler. | Employ a RunJS query (e.g., `await components.checkbox1.setChecked(true)`) or trigger it using an event. |
| setValue      | Sets the value of the checkbox.                                                                      | Employ a RunJS query (e.g., `await components.checkbox1.setValue(true)`) or trigger it using an event. |
| setLoading    | Toggles the loading state of the checkbox.                                                           | Employ a RunJS query (e.g., `await components.checkbox1.setLoading(true)`) or trigger it using an event. |
| setVisibility | Changes the visibility of the checkbox.                                                              | Employ a RunJS query (e.g., `await components.checkbox1.setVisibility(true)`) or trigger it using an event. |
| setDisable    | Disables or enables the checkbox.                                                                    | Employ a RunJS query (e.g., `await components.checkbox1.setDisable(true)`) or trigger it using an event. |
| toggle        | Toggles the current state of the checkbox.                                                           | Employ a RunJS query (e.g., `await components.checkbox1.toggle()`) or trigger it using an event. |


</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables  </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:-------------|:------------------------------------|:-------------------------------------------------|
| value        | Holds the boolean value `true` if the checkbox is checked and `false` if unchecked. | Accessible dynamically with JS (e.g., `{{components.checkbox1.value}}`). |
| label        | The text label of the checkbox. | Accessible dynamically with JS (e.g., `{{components.checkbox1.label}}`). |
| isValid      | Indicates if the checkbox state is valid. | Accessible dynamically with JS (e.g., `{{components.checkbox1.isValid}}`). |
| isMandatory  | Indicates if the checkbox is mandatory. | Accessible dynamically with JS (e.g., `{{components.checkbox1.isMandatory}}`). |
| isLoading    | Indicates if the checkbox is in a loading state. | Accessible dynamically with JS (e.g., `{{components.checkbox1.isLoading}}`). |
| isVisible    | Indicates if the checkbox is visible. | Accessible dynamically with JS (e.g., `{{components.checkbox1.isVisible}}`). |
| isDisabled   | Indicates if the checkbox is disabled. | Accessible dynamically with JS (e.g., `{{components.checkbox1.isDisabled}}`). |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no value is entered. | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{components.checkbox1.value === false &&"Value needs to be checked"}}`).           |

To add regex inside `Custom Validation`, you can use the below format: 

**Format**: `{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}`

**Example**: `{{(/^\d{1,10}$/.test(components.textinput1.value)) ? '' : 'Error message';}}`

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Visibility         | Controls component visibility. Toggle or set dynamically.                                                 | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Disable            | Enables or disables the component. Toggle or set dynamically.                                             | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display.                                 | String (e.g., `Are you a registered user?` ).                       |

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
| Text color    | Sets the color of the component's label. | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Alignment      | Sets the position of the label and input field. | Click on the toggle options or click on `fx` to input code that programmatically returns an alignment value - `left` or `right`. |

## Switch

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Border color    | Sets the color of the checkbox. | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Checked color    | Sets the color of the checkbox when it is checked. | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Unchecked color    | Sets the color of the checkbox when it is not checked. | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Handle color    | Sets the color of the checked symbol inside the checkbox. | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Box shadow      | Sets the box shadow properties of the component.                                              | Select the box shadow color and adjust the related properties or set it programmatically using `fx`.                                            |

</div>


