---
id: dropdown
title: Dropdown
---
# Dropdown

The Dropdown component can be used to collect user input from a list of options. This document goes through all the properties related to the **Dropdown** component.

:::info
To get the configuration of legacy Dropdown component, please refer to **[this](/docs/widgets/2.50.0-LTS/dropdown)** document.
:::

## Data
| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label         | Text to display as the label for the field.           | String (e.g., `Country`).         |
| Placeholder   | A hint displayed to guide the user on what to enter.  | String (e.g., `Choose an option`).          |

## Options
Allows you to add options to the dropdown field. You can click on `Add new option` and add options manually or enable `Dynamic options` and enter the options using code. 

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

## Events

**On select** <br/>
Triggers when an option is selected.

**On search text changed** <br/>
Triggers when search text changes.

**On focus** <br/>
Triggers whenever the user clicks inside the component.

**On blur** <br/>
Triggers whenever the user clicks outside the component.

## Component specific actions (CSA)

Following actions of the component can be controlled using the component specific actions(CSA):


| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| clear()        | Clears the selected option.      | Employ a RunJS query (for e.g.,  <br/> `await components.dropdown1.clear()`) or trigger it using an event. |
| setVisibility()| Sets the visibility of the component.            | Employ a RunJS query (for e.g.,  <br/> `await components.dropdown1.setVisibility(false)`) or trigger it using an event. |
| setLoading()   | Sets the loading state of the component.         | Employ a RunJS query (for e.g.,  <br/> `await components.dropdown1.setLoading(true)`) or trigger it using an event. |
| setDisable()   | Disables the component.                           | Employ a RunJS query (for e.g., <br/> `await components.dropdown1.setDisable(true)`) or trigger it using an event. |
| selectOption()        | Selects an option.      | Employ a RunJS query (for e.g.,  <br/> `await components.dropdown1.clear()`) or trigger it using an event. |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:----------|:----------|:------------|
| searchText          | This variable is initially empty and holds the value whenever the user searches on the dropdown.      | Accessible dynamically with JS (for e.g., `{{components.dropdown1.searchText}}`).                                     |
| label               | Holds the label name of the dropdown.                                                                 | Accessible dynamically with JS (for e.g., `{{components.dropdown1.label}}`).                                          |
| value               | Holds the value entered by the user in the component.                                                 | Accessible dynamically with JS (for e.g., `{{components.dropdown1.value}}`).                                          |
| selectedOption        | Holds the label and value of the selected option in array form.                                 | Accessible dynamically with JS (for e.g., `{{components.dropdown1.selectedOption.label}}` or <br/>`{{components.dropdown1.selectedOption.value}}`). |
| isValid             | Indicates if the input meets validation criteria.                                                     | Accessible dynamically with JS (for e.g., `{{components.dropdown1.isValid}}`).                                        |
| options        | Holds all the option values of the dropdown in array form.                                 | Accessible dynamically with JS (for e.g., `{{components.dropdown1.options}}` or <br/>`{{components.dropdown1.options[0].label}}` for a specific option). |
| isVisible           | Indicates if the component is visible.                                                                | Accessible dynamically with JS (for e.g., `{{components.dropdown1.isVisible}}`).                                      |
| isLoading           | Indicates if the component is loading.                                                                | Accessible dynamically with JS (for e.g., `{{components.dropdown1.isLoading}}`).                                      |
| isDisabled          | Indicates if the component is disabled.                                                               | Accessible dynamically with JS (for e.g., `{{components.dropdown1.isDisabled}}`).                                     |
| isMandatory         | Indicates if the field is required.                                                                   | Accessible dynamically with JS (for e.g., `{{components.dropdown1.isMandatory}}`).                                    |

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Make this field mandatory    | Displays a 'Field cannot be empty' message if no option is selected. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Custom validation  | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{components.dropdown.value<5&&"Value needs to be more than 5"}}`).           |


## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility. Toggle or set dynamically.                                                 | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component. Toggle or set dynamically.                                             | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display.                                 | String (e.g., `Enter your name here.` ).                       |

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
| Text       | Sets the text color of the text entered in the component.                                     | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Accent       | Sets the color of the border when the dropdown is opened.                                     | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Error text | Sets the text color of validation message that displays.                                      | Select the color or click on **fx** and input code that programmatically returns a Hex color code.          |
| Icon            | Allows you to select an icon for the component.                                               | Enable the icon visibility, select icon and icon color         |
| Border radius   | Modifies the border radius of the component.                                                  | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value.           |
| Box shadow      | Sets the box shadow properties of the component.                                              | Select the box shadow color and adjust the related properties.                                            |


## Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.

