---
id: cascader
title: Cascader
---

The Cascader component lets users select a single value from a hierarchical (nested) set of options by drilling down through levels, such as **Continent > Country > City**. 

## Data

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div>                                                              | <div style={{width: "200px"}}> Expected Value </div> |
| :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| Label                                             | Text to display as the label for the component.                                                                   | String (e.g., `Select`).                               |
| Placeholder                                       | A hint displayed when no option is selected.                                                                      | String (e.g., `Select an option`).                     |
| Path separator                                    | The separator used to join the selected path's labels, both in the field display and in the `pathString` exposed variable. | String (e.g., `/`). Defaults to `/`.                   |

## Options

Allows you to add the hierarchical options for the Cascader. You can click on `Add new option` to build the tree manually, or enable `Dynamic options` and provide the hierarchical structure using code.

When building options manually, click an option to edit its **Option label**, **Option value**, **Visibility**, and **Disable** fields, click the **+** icon on an option to add a nested option under it, and drag options to reorder them.

:::info
Only options without any `children` (leaf nodes) can be selected. Selecting a parent node isn't possible — clicking it drills into its children instead.
:::

### Example Schema for Dynamic Options

Enter the schema in the following syntax to use Dynamic options:

```js
{{[
  {
    label: 'Asia',
    value: 'asia',
    children: [
      {
        label: 'China',
        value: 'china',
        children: [
          { label: 'Beijing', value: 'beijing' },
          { label: 'Shanghai', value: 'shanghai' },
        ],
      },
      { label: 'Japan', value: 'japan' },
      {
        label: 'India',
        value: 'india',
        children: [
          { label: 'Delhi', value: 'delhi' },
          { label: 'Mumbai', value: 'mumbai' },
          { label: 'Bengaluru', value: 'bengaluru', default: true },
        ],
      },
    ],
  },
  {
    label: 'Europe',
    value: 'europe',
    children: [
      { label: 'France', value: 'france' },
      { label: 'Spain', value: 'spain' },
      { label: 'England', value: 'england', disable: true },
    ],
  },
  { label: 'Africa', value: 'africa', visible: false },
]}}
```

- `children` - An array of options in the same shape, nested to any depth. Omit it (or leave it empty) to mark an option as a selectable leaf.
- `default` - Set to `true` on a leaf option to pre-select it. Only the first visible leaf found with `default: true` is used.
- `visible` - Set to `false` to hide an option. Hiding a parent also hides its entire branch.
- `disable` - Set to `true` to prevent an option from being selected or expanded.

### Default value

When options are added manually (Dynamic options disabled), use **Default value** to pre-select an option by its `value`. It only takes effect when the value matches an existing leaf option.

### Options Loading State

Available when Dynamic options is enabled. Allows you to add a loading state to the dynamically generated options. You can enable or disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.

## Events

| <div style={{ width:"135px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div>          |
| :------------------------------------------- | :----------------------------------------------------------- |
| On select                                    | Triggers whenever a leaf option is selected or cleared.      |
| On focus                                     | Triggers whenever the user clicks inside the component.      |
| On blur                                      | Triggers whenever the user clicks outside the component.     |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component specific actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div>                                                                | <div style={{width: "200px"}}> How To Access </div>       |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------- |
| setValue( )                                     | Selects the leaf option matching the given value. If the value doesn't match a leaf option, the selection is cleared. | `components.cascader1.setValue('beijing')`                 |
| clearValue( )                                   | Clears the selected option.                                                                                          | `components.cascader1.clearValue()`                        |
| setLoading( )                                   | Sets the loading state of the component.                                                                             | `components.cascader1.setLoading(true)`                    |
| setOptionsLoading( )                            | Sets the options loading state of the component.                                                                     | `components.cascader1.setOptionsLoading(true)`              |
| setVisibility( )                                | Sets the visibility of the component.                                                                                | `components.cascader1.setVisibility(false)`                |
| setDisable( )                                   | Disables the component.                                                                                              | `components.cascader1.setDisable(true)`                    |

**Note:** The data type passed to `setValue()` depends on how the option's `value` is defined — when adding options manually, values are typically strings; when using Dynamic options, pass the value with the same data type used in your schema.

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div>                                                              | <div style={{width: "200px"}}> How To Access </div>          |
| :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------- |
| label                                              | Holds the label name of the Cascader component.                                                                      | `{{components.cascader1.label}}`                                 |
| value                                              | Holds the `value` of the selected leaf option.                                                                       | `{{components.cascader1.value}}`                                 |
| selectedOption                                     | Holds the `label` and `value` of the selected leaf option.                                                           | `{{components.cascader1.selectedOption.label}}`                  |
| pathArray                                          | Holds the `value` of each option along the selected path, from the root to the selected leaf.                        | `{{components.cascader1.pathArray[0]}}`                          |
| pathLabels                                         | Holds the `label` of each option along the selected path, from the root to the selected leaf.                        | `{{components.cascader1.pathLabels[0]}}`                         |
| pathString                                         | Holds `pathLabels` joined using the **Path separator**.                                                              | `{{components.cascader1.pathString}}`                            |
| isLoading                                          | Indicates if the component is loading.                                                                               | `{{components.cascader1.isLoading}}`                             |
| isOptionsLoading                                   | Indicates if the options are loading.                                                                                | `{{components.cascader1.isOptionsLoading}}`                      |
| isValid                                            | Indicates if the input meets validation criteria.                                                                    | `{{components.cascader1.isValid}}`                               |
| isVisible                                          | Indicates if the component is visible.                                                                               | `{{components.cascader1.isVisible}}`                             |
| isDisabled                                         | Indicates if the component is disabled.                                                                              | `{{components.cascader1.isDisabled}}`                            |
| isMandatory                                        | Indicates if the field is required.                                                                                  | `{{components.cascader1.isMandatory}}`                           |

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div>                     | <div style={{width: "200px"}}> Expected Value </div>                                                                         |
| :----------------------------------------------------------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Make this field mandatory                                    | Displays a 'Field cannot be empty' message if no option is selected.    | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Custom validation                                             | Specifies a validation error message for specific conditions.           | Logical Expression (e.g., `{{!components.cascader1.value && "Please select an option"}}`).                                   |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                                                        | <div style={{ width:"250px"}}> Configuration Options </div>                                                                  |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Show clear selection button                     | Gives a button to clear the selected option.                                                                    | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Loading state                                   | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.        | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility                                      | Controls component visibility. Toggle or set dynamically.                                                       | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Collapse when hidden                            | Collapses the component's space when it is hidden, so surrounding components fill the space.                   | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable                                         | Enables or disables the component. Toggle or set dynamically.                                                   | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip                                         | Provides additional information on hover. Set a string value for display.                                       | String (e.g., `Select an option.`).                                                                                          |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>                                                                              |
| :------------------------------------------------ | :---------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                    | Makes the component visible in desktop view.           | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile                                     | Makes the component visible in mobile view.            | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :---------------------------------------------------- | :----------------------------------------------------- | :---------------------------------------------------------------- |
| Color                                                  | Sets the color of the component's label.                | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Alignment                                              | Sets the position of the label and the field.           | Click on the toggle options or click on **fx** to input code that programmatically returns an alignment value - **side** or **top**. |
| Width                                                  | Sets the width of the field.                            | Enable **Auto width** to use the standard width automatically. Disable it to manually adjust the width using the slider or by entering a numeric value via **fx**. You can also choose whether the width is calculated relative to the **Container** or relative to the **Field**. |

### Field

| <div style={{ width:"100px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :---------------------------------------------------- | :----------------------------------------------------- | :---------------------------------------------------------------- |
| Background                                             | Sets the background color of the component.             | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border                                                 | Sets the border color of the component.                 | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Accent                                                 | Sets the color of the border when the component is opened. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Text                                                   | Sets the color of the selected path text.                | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Placeholder text                                       | Sets the color of the placeholder text displayed when no option is selected. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Error text                                             | Sets the text color of the validation message that displays. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Icon                                                   | Allows you to select an icon for the component.          | Enable the icon visibility, select icon and icon color. |
| Border radius                                          | Modifies the border radius of the component.             | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Box shadow                                             | Sets the box shadow properties of the component.         | Select the box shadow color and adjust the related properties. |
| Menu width                                             | Controls the width of the dropdown menu.                 | Choose **Match the field**, **Match the content**, or **Custom** (enter a custom width value). |

### Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.
