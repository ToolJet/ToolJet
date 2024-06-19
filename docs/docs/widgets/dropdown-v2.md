---
id: dropdown-v2
title: Dropdown
---

# Dropdown

The Dropdown component can be used to collect user input from a list of options. This document goes through all the properties related to the **Dropdown** component.

:::info
To get the configuration of the legacy Dropdown component, please refer to **[this](/docs/2.43.0/widgets/dropdown)** document.
:::

## Data
| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the field.           | String (e.g., `Country`).         |
| Placeholder   | A hint displayed to guide the user on what to select.  | String (e.g., `Choose an option`).          |

## Options
Allows you to add options to the dropdown field. You can define various attributes for each option, including the label, value, default selection, visibility, and whether the option is disabled. 

You can click on `Add new option` to define options or enable `Dynamic options` and enter the options manually or using code. 

Below is a sample schema for the `Dynamic options`:

```js
{{[{label: 'Option 1',value: '1',disable: false,visible: true,default: true},
{label: 'Option 2',value: '2',disable: false,visible: true},
{label: 'Option 3',value: '3',disable: false,visible: true}]}}
```

## Events

| Event            | Description         |
|:------------------|:---------------------|
| **On select**    | Triggers when an option is selected.               |
| **On focus**     | Triggers whenever the user clicks inside the component.                   |
| **On blur**      | Triggers whenever the user clicks outside the component.                   |
| **On search text changed** | Triggers when search text changes.|


:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

## Component specific actions (CSA)

The following actions of component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| clear()        | Clears the selected option.      | Employ a RunJS query (for e.g.,  <br/> `await components.dropdown1.clear()`) or trigger it using an event. |
| selectOption()        | Selects an option.      | Employ a RunJS query (for e.g.,  <br/> `await components.dropdown1.selectOption(...)`) or trigger it using an event. |
| setVisibility()| Sets the visibility of the component.            | Employ a RunJS query (for e.g.,  <br/> `await components.dropdown1.setVisibility(false)`) or trigger it using an event. |
| setLoading()   | Sets the loading state of the component.         | Employ a RunJS query (for e.g.,  <br/> `await components.dropdown1.setLoading(true)`) or trigger it using an event. |
| setDisable()   | Disables the component.                           | Employ a RunJS query (for e.g., <br/> `await components.dropdown1.setDisable(true)`) or trigger it using an event. |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:----------|:---------- |:------------|
| label               | Holds the label name of the dropdown.                                                                 | Accessible dynamically with JS (for e.g., `{{components.dropdown1.label}}`).                                          |
| selectedOption | Holds the selected option in the dropdown component.                                    | Accessible dynamically with JS (for e.g., `{{components.dropdown1.selectedOption.label}}`).                            |
| options          | Shows all the options in the dropdown as key-value pairs.      | Accessible dynamically with JS (for e.g., `{{components.dropdown1.options}}`).                                     |
| searchText          | This variable is initially empty and holds the value whenever the user searches on the dropdown.      | Accessible dynamically with JS (for e.g., `{{components.dropdown1.searchText}}`).                                     |
| isValid             | Indicates if the input meets validation criteria.                                                     | Accessible dynamically with JS (for e.g., `{{components.dropdown1.isValid}}`).                                        |
| isMandatory         | Indicates if the field is required.                                                                   | Accessible dynamically with JS (for e.g., `{{components.dropdown1.isMandatory}}`).                                    |
| isLoading           | Indicates if the component is loading.                                                                | Accessible dynamically with JS (for e.g., `{{components.dropdown1.isLoading}}`).                                      |
| isVisible           | Indicates if the component is visible.                                                                | Accessible dynamically with JS (for e.g., `{{components.dropdown1.isVisible}}`).                                      |
| isDisabled          | Indicates if the component is disabled.                                                               | Accessible dynamically with JS (for e.g., `{{components.dropdown1.isDisabled}}`).                                     |

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{components.dropdown.value<5&&"Value needs to be more than 5"}}`).           |
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no option is selected. | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |

To add regex inside `Custom validation`, you can use the below format: 

**Format**: 
```js
{{(<regexPattern>.test(<value>)) ? '' : 'Error message';}}
```

**Example**: 
```js
{{(/^\d{1,10}$/.test(components.numberinput1.value)) ? '' : 'Error message';}}
```


## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Visibility         | Controls component visibility. Toggle or set dynamically.                                                 | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Disable            | Enables or disables the component. Toggle or set dynamically.                                             | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value to display.                                 | String (e.g., `Select the location.` ).                       |

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
| Color     | Sets the color of the component's label. | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Alignment      | Sets the position of the label and input field. | Click on the toggle options or click on `fx` to input code that programmatically returns an alignment value - `side` or `top`. |
| Width          | Sets the width of the input field. | Keep the `Auto width` option for standard width or deselect it to modify the width using the slider or through code entry in `fx` that returns a numeric value. |

## Field

| <div style={{ width:"100px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background        | Sets the background color of the component.                                                   | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Border     | Sets the border color of the component.                                                       | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Accent       | Sets the text color of the border when the component is selected.                                     | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Text       | Sets the text color of the text entered in the component.                                     | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Error text | Sets the text color of validation message that displays.                                      | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Icon            | Allows you to select an icon for the component.                                               | Enable the icon visibility, select icon and icon color         |
| Border radius   | Modifies the border radius of the component.                                                  | Enter a number or click on `fx` and enter a code that programmatically returns a numeric value.           |
| Box shadow      | Sets the box shadow properties of the component.                                              | Select the box shadow color and adjust the related properties.                                            |


## Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.

