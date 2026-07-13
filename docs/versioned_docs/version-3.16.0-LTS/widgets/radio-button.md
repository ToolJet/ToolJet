---
id: radio-button-v2
title: Radio Button
---

The **Radio button** component can be used to collect user input from a list of options.

## Data

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Label                                          | Text to display as the label for the component.   | String (e.g., `Select an option`).                   |

## Options

Allows you to add options to the radio button field. You can click on **Add new option** button and add options manually or enable `Dynamic options` and enter the options using code.

### Example Code for Dynamic Options

1. Passing an array of objects and specifying each value:

```js
{
  {
    [
      {
        label: "option1",
        value: 1,
        disable: false,
        visible: true,
        default: true,
      },
      { label: "option2", value: 2, disable: false, visible: true },
      { label: "option3", value: 3, disable: false, visible: true },
    ];
  }
}
```

2. Passing an array of objects with a default value from a **Table** component's selected row:

```js
{
  {
    queries.getEmployees.data.map((option) => ({
      label: option.firstname,
      value: option.firstname,
      disable: false,
      visible: true,
      default: option.firstname === components.table1.selectedRow.firstname,
    }));
  }
}
```

### Layout

Controls how the radio button options are arranged within the component.

| <div style={{ width:"100px"}}> Value </div> | <div style={{ width:"250px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| Row | Options are arranged horizontally in a single row. |
| Column | Options are stacked vertically in a single column. |
| Wrap | Options are arranged horizontally and wrap to the next line when they exceed the available width. |

### Options loading state

Allows you to add a loading state to the dynamically generated options. You can enable or disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| selectOption()                                | Selects an option.                                | `components.radiobutton1.selectOption(2)`           |
| deselectOption()                              | Deselects the selected option.                    | `components.radiobutton1.deselectOption()`          |
| setVisibility()                               | Sets the visibility of the component.             | `components.radiobutton1.setVisibility(false)`      |
| setLoading()                                  | Sets the loading state of the component.          | `components.radiobutton1.setLoading(true)`          |
| setDisable()                                  | Disables the component.                           | `components.radiobutton1.setDisable(true)`          |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div>              | <div style={{width: "200px"}}> How To Access </div>                                          |
| :--------------------------------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| label                                          | Holds the label name of the radio button.                      | `{{components.radiobutton1.label}}`                                                          |
| value                                          | Holds the value selected by the user in the component.         | `{{components.radiobutton1.value}}`                                                          |
| options                                        | Holds all the option values of the radio button in array form. | `{{components.radiobutton1.options}}` or <br/>`{{components.radiobutton1.options[0].label}}` |
| isValid                                        | Indicates if the input meets validation criteria.              | `{{components.radiobutton1.isValid}}`                                                        |
| isMandatory                                    | Indicates if the field is required.                            | `{{components.radiobutton1.isMandatory}}`                                                    |
| isLoading                                      | Indicates if the component is loading.                         | `{{components.radiobutton1.isLoading}}`                                                      |
| isVisible                                      | Indicates if the component is visible.                         | `{{components.radiobutton1.isVisible}}`                                                      |
| isDisabled                                     | Indicates if the component is disabled.                        | `{{components.radiobutton1.isDisabled}}`                                                     |

## Events

| <div style={{ width:"135px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On select                                   | Triggers whenever an option is selected.          |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div>                    | <div style={{width: "200px"}}> Expected Value </div>                                                                         |
| :------------------------------------------------------ | :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Make this field mandatory                               | Displays a 'Field cannot be empty' message if no option is selected. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Custom validation                                       | Specifies a validation error message for specific conditions.        | Logical Expression (e.g., `{{!components.radiobutton1.value && "Please select an option"}}`).                                |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                                                       | <div style={{ width:"250px"}}> Configuration Options </div>                                                                  |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Loading state        | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility           | Controls component visibility.                                               | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Collapse when hidden | Collapses the component's space when hidden, so surrounding components fill the space. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable              | Enables or disables the component.                                           | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip              | Displays an informational tooltip when the user hovers over the component.   | String (e.g., `Select an option`).                                                                                          |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Makes the component visible in desktop view.      | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile                                 | Makes the component visible in mobile view.       | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"130px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :---------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Color | Sets the color of the component's label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Alignment | Sets the position of the label relative to the options. | Click on the toggle options or click on **fx** to input code that programmatically returns an alignment value — `side` or `top`. |
| Direction | When alignment is set to `side`, controls whether the label appears to the left or right of the options. | Select **Left** or **Right** using the icon toggles. |
| Width | Sets the width of the label. Available when alignment is `side`. | Enable **Auto** to use the standard width automatically, or disable it to manually set the width using the slider or **fx**. You can also choose whether the width is calculated relative to the **Container** or the **Field**. |

### Switch

| <div style={{ width:"130px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :---------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Border | Sets the border color of the radio buttons. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Checked background | Sets the background color of the selected radio button. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Unchecked background | Sets the background color of unselected radio buttons. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Handle color | Sets the fill color of the selected radio button's indicator dot. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Text | Sets the color of the option labels. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |

### Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::
