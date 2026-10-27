---
id: tree-select
title: Tree Select
---

The **Tree Select** component displays checkboxes in a hierarchical tree that users can expand and collapse. Use it to let users pick one or more items from nested options, such as **Continent > Country > City**.

## Data

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :--- | :--- | :--- |
| Label | Text to display as the label for the component. | String (e.g., `Countries`). |

## Options

Allows you to add the hierarchical options for the Tree Select. You can click on **Add new option** to build the tree manually, or enable **Dynamic options** and provide the hierarchical structure using code.

When building options manually:

- Click an option, or select **Edit option** from its menu, to edit its **Option label**, **Option value**, **Selected**, **Expanded**, **Visibility** and **Disable** fields. **Selected** checks the option by default, and **Expanded** expands it by default.
- Click the **+** icon on an option (**Create nested option**) to add a nested option under it.
- Select **Delete option** from an option's menu to remove it.
- Drag options to reorder them.

:::info
Each option's `value` must be unique across the whole tree.
:::

### Example Schema for Dynamic Options

When **Dynamic options** is enabled, enter the options in the **Schema** field using the following syntax:

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
          { label: 'Bengaluru', value: 'bengaluru' },
        ],
      },
    ],
  },
  {
    label: 'Europe',
    value: 'europe',
    children: [
      { label: 'France', value: 'france' },
      { label: 'Spain', value: 'spain', disable: true },
      { label: 'England', value: 'england' },
    ],
  },
  { label: 'Africa', value: 'africa', visible: false },
]}}
```

- `children` - An array of options in the same shape, nested to any depth.
- `visible` - Set to `false` to hide an option. Hiding a parent also hides its entire branch.
- `disable` - Set to `true` to prevent an option from being checked or unchecked.

With Dynamic options enabled, two more fields appear:

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :--- | :--- | :--- |
| Selected values | The values of the options checked by default. | Array of values (e.g., `{{["asia", "spain"]}}`). |
| Expanded values | The values of the options expanded by default. | Array of values (e.g., `{{["asia"]}}`). |

### Allow Independent Selection

Controls how checking an option affects its parent and children.

- **Off** (default): Checking a parent checks all of its children. A parent is checked when all of its children are checked, and shows a partially checked state when only some of them are. Unchecking an option also unchecks its children and its parents.
- **On**: Each option is checked or unchecked on its own, without affecting its parent or children.

You can enable or disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.

## Events

| <div style={{ width:"135px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
| :--- | :--- |
| On change | Triggers whenever an option is checked or unchecked. |
| On check | Triggers whenever an option is checked. |
| On uncheck | Triggers whenever an option is unchecked. |

:::info
Check [Action Reference](/docs/actions/overview) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :--- | :--- | :--- |
| selectOptions( ) | Checks the options with the given values. The given values replace the current selection. Accepts an array or a single value. | `components.treeselect1.selectOptions(['asia', 'spain'])` |
| deselectOptions( ) | Unchecks the options with the given values. Other checked options stay checked. Accepts an array or a single value. | `components.treeselect1.deselectOptions(['spain'])` |
| setLoading( ) | Sets the loading state of the component. | `components.treeselect1.setLoading(true)` |
| setVisibility( ) | Sets the visibility of the component. | `components.treeselect1.setVisibility(false)` |
| setDisable( ) | Disables the component. | `components.treeselect1.setDisable(true)` |

**Note:** `selectOptions()` and `deselectOptions()` don't trigger the **On change**, **On check** or **On uncheck** events.

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :--- | :--- | :--- |
| checked | Holds the values of all checked options. | `{{components.treeselect1.checked}}` |
| expanded | Holds the values of all expanded options. | `{{components.treeselect1.expanded}}` |
| checkedPathArray | Holds the path of each checked option as an array of values, from the root to the option. | `{{components.treeselect1.checkedPathArray[0]}}` |
| checkedPathStrings | Holds the path of each checked option as a string of values joined by `-`, for example `asia-china-beijing`. | `{{components.treeselect1.checkedPathStrings[0]}}` |
| leafPathArray | Same as `checkedPathArray`, but only for checked options that have no children. | `{{components.treeselect1.leafPathArray[0]}}` |
| leafPathStrings | Same as `checkedPathStrings`, but only for checked options that have no children. | `{{components.treeselect1.leafPathStrings[0]}}` |
| isValid | Indicates if the selection meets the validation criteria. | `{{components.treeselect1.isValid}}` |
| isMandatory | Indicates if the field is required. | `{{components.treeselect1.isMandatory}}` |
| isLoading | Indicates if the component is loading. | `{{components.treeselect1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.treeselect1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.treeselect1.isDisabled}}` |

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :--- | :--- | :--- |
| Make this field mandatory | Displays a *Field cannot be empty* message if no option is checked. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Minimum selection | The minimum number of options that must be checked. Displays *Minimum N selections required* if fewer are checked. `0` means no minimum. | Number (e.g., `{{2}}`). |
| Maximum selection | The maximum number of options that can be checked. Displays *Maximum N selections allowed* if more are checked. `0` means no maximum. | Number (e.g., `{{5}}`). |
| Custom validation | Specifies a validation error message for specific conditions. | Logical Expression (e.g., `{{components.treeselect1.checked.length === 0 && "Select at least one country"}}`). |

**Note:** The selection count includes every checked option, parents included.

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Dynamic height | Automatically adjusts the component's height based on its content. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Collapse when hidden | Collapses the component's space when it is hidden, so surrounding components fill the space. Takes effect when the app runs (preview or released app), not on the editor canvas. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Supports **Plain text**, **Markdown**, and **HTML** formats. | String (e.g., `Select one or more countries.`). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--- | :--- | :--- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div>                                                                                                                                                   | <div style={{ width:"100px"}}> Default Value </div> |
| :------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------- |
| Text color                                  | Change the color of the text in the component by providig the `Hex color code` or choosing a color from the picker.                                                                                 |                                                     |
| Checkbox color                              | Change the color of the toggle switch in the component by providig the `Hex color code` or choosing a color from the picker.                                                                        |                                                     |

## Layout

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--- | :--- | :--- |
| Color | Sets the color of the component's label. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Size | Sets the font size of the label. Defaults to `12`. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Style | Chooses the label layout: **New** (default) or **Legacy**. **Alignment**, the direction and **Width** are only available with **New**. | Select **New** or **Legacy**. |
| Alignment | Sets the position of the label and the tree. | Click on the toggle options or click on **fx** to input code that programmatically returns an alignment value - **side** or **top**. Use the direction icons to place the label on the left or right. |
| Width | Sets the width of the label when it is on the side. | Enable **Auto width** to use the standard width automatically. Disable it to manually adjust the width using the slider or by entering a numeric value via **fx**. |

### Switch

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--- | :--- | :--- |
| Border | Sets the border color of the checkboxes. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Unchecked background | Sets the background color of unchecked checkboxes. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Checked background | Sets the background color of checked checkboxes. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Checkmark | Sets the color of the checkmark. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Option text | Sets the color of the option labels. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--- | :--- | :--- |
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties. |
| Padding | Sets the padding around the component. | Choose **Default** or **None**. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::
