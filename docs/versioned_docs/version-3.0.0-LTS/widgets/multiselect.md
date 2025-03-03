---
id: multiselect
title: Multiselect
---
# Multiselect

The Multiselect component enables users to select multiple options from a predefined list, making it ideal for gathering multiple inputs.

## Data

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the component.           | String (e.g., `Select an option`).         |
| Placeholder         | Text to display when none of the options are selected.           | String (e.g., `Select the loan type`).         |


## Options
Allows you to add options to the multiselect component field. You can click on `Add new option` and add options manually or enable `Dynamic options` and enter the options using code. 

### Example Code for Dynamic Columns

1. Passing an array of objects and specifying each value:

```js
{{
    [{label: 'option1', value: 1, disable: false, visible: true, default: true},
    {label: 'option2', value: 2, disable: false, visible: true},
    {label: 'option3', value: 3, disable: false, visible: true}]
}}
```

2. Passing an array of objects with a default value from a **Table** component's selected row:

```js
{{
    queries.getEmployees.data.map(option => ({
    label: option.firstname,
    value: option.firstname,
    disable: false,
    visible: true,
    default: option.firstname === components.table1.selectedRow.firstname 
    }))
}} 
```

### Options loading state
Allows you to add a loading state to the dynamically generated options. You can enable or disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.

## Component specific actions (CSA)

Following actions of the component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| clear()        | Clears the selected option.      | Employ a RunJS query (for e.g.,  <br/> `await components.multiselect1.clear()`) or trigger it using an event. |
| setVisibility()| Sets the visibility of the component.            | Employ a RunJS query (for e.g.,  <br/> `await components.multiselect1.setVisibility(false)`) or trigger it using an event. |
| setLoading()   | Sets the loading state of the component.         | Employ a RunJS query (for e.g.,  <br/> `await components.multiselect1.setLoading(true)`) or trigger it using an event. |
| setDisable()   | Disables the component.                           | Employ a RunJS query (for e.g., <br/> `await components.multiselect1.setDisable(true)`) or trigger it using an event. |
| selectOptions()        | Selects an option.      | Employ a RunJS query (for e.g.,  <br/> `await components.multiselect1.selectOptions(['2','3'])`) or trigger it using an event. |
| deselectOptions()        | Deselects all options.      | Employ a RunJS query (for e.g.,  <br/> `await components.multiselect1.deselectOptions()`) or trigger it using an event. |

**Note:** The data type passed to CSAs like `selectOptions()` depends on how you configure the component. When adding options manually using the **Add new option** button, values must be strings (for example, `components.multiselect1.selectOptions(['2', '3'])`). When using dynamic options, supply values with the correct data types as they appear in your code logic. 

For example, if the code is:
```javascript
{{
    [
        { label: 'option1', value: 1, disable: false, visible: true, default: true },
        { label: 'option2', value: 2, disable: false, visible: true },
        { label: 'option3', value: 3, disable: false, visible: true }
    ]
}}
```

You should pass numeric values in the `selectOptions` component-specific action since the value type is **Number**:

```javascript
components.multiselect1.selectOptions([2, 3])
```

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:----------|:----------|:------------|
| label               | Holds the label name of the multiselect component.                                                                 | Accessible dynamically with JS (for e.g., `{{components.multiselect1.label}}`).                                          |
| value               | Holds the value selected by the user in the component.                                                 | Accessible dynamically with JS (for e.g., `{{components.multiselect1.value}}`).                                          |
| options        | Holds all the option values of the multiselect component in array form.                                 | Accessible dynamically with JS (for e.g., `{{components.multiselect1.options}}` or <br/>`{{components.multiselect1.options[0].label}}` for a specific option). |
| isValid             | Indicates if the input meets validation criteria.                                                     | Accessible dynamically with JS (for e.g., `{{components.multiselect1.isValid}}`).                                        |
| isMandatory         | Indicates if the field is required.                                                                   | Accessible dynamically with JS (for e.g., `{{components.multiselect1.isMandatory}}`).                                    |
| isLoading           | Indicates if the component is loading.                                                                | Accessible dynamically with JS (for e.g., `{{components.multiselect1.isLoading}}`).                                      |
| isVisible           | Indicates if the component is visible.                                                                | Accessible dynamically with JS (for e.g., `{{components.multiselect1.isVisible}}`).                                      |
| isDisabled          | Indicates if the component is disabled.                                                               | Accessible dynamically with JS (for e.g., `{{components.multiselect1.isDisabled}}`).                                     |

## Events

| <div style={{ width:"135px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------------- | :--------------------------------------------- |
| On select | The **On select** event is triggered when a particular option is chosen. |

:::info
For comprehensive information on all available **Actions**, refer to the [Action Reference](/docs/category/actions-reference) documentation.
:::

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no option is selected. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{!components.multiselect1.value && "Please select an option"}}`).           |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility. Toggle or set dynamically.                                                 | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component. Toggle or set dynamically.                                             | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display.                                 | String (e.g., `Select an option.` ).                       |

## Devices

**Show on desktop**

Makes the component visible in desktop view. You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.

**Show on mobile**

Makes the component visible in mobile view. You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.


---

## Label

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Color     | Sets the color of the component's label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Alignment      | Sets the position of the label and input field. | Click on the toggle options or click on **fx** to input code that programmatically returns an alignment value - `side` or `top`. |
| Width          | Sets the width of the input field. | Keep the `Auto width` option for standard width or deselect it to modify the width using the slider or through code entry in **fx** that returns a numeric value. |

## Field

| <div style={{ width:"100px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background        | Sets the background color of the component.                                                   | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Border     | Sets the border color of the component.                                                       | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Accent       | Sets the color of the border when the dropdown is opened.                                     | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Text       | Sets the text color of the text entered in the component.                                     | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Error text | Sets the text color of validation message that displays.                                      | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Icon            | Allows you to select an icon for the component.                                               | Enable the icon visibility, select icon and icon color         |
| Border radius   | Modifies the border radius of the component.                                                  | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value.           |
| Box shadow      | Sets the box shadow properties of the component.                                              | Select the box shadow color and adjust the related properties.                                            |

## Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.





