---
id: key-value-pair
title: Key Value Pair
---

The **Key Value Pair** component displays data in a structured key-value format, making it ideal for presenting record details, user profiles, configuration settings, or any data where each entry has a label and a corresponding value. It supports multiple field types including text, numbers, dates, dropdowns, links, booleans, and more, with inline editing and a built-in save/discard workflow.

## Example Usage

A support team needs a **Customer Detail Panel** that shows individual customer records pulled from a database - name, email, signup date, subscription status, and tags. Using the Key Value Pair component, each field renders with the appropriate input type (datepicker for dates, toggle for status, multiselect for tags), and agents can edit values directly and save changes back to the database through a query triggered on the **Save changes** event.

## Properties

### Data

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "300px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Data source | Selects how data is provided to the component. | Select **Raw JSON** or a query from the dropdown. |
| Data | The JSON object containing key-value pairs to display. | Object (e.g., `{{ { name: 'Jane', email: 'jane@example.com', status: true } }}`). |

### Fields

Each key in the data object is auto-detected as a field. You can configure individual fields by clicking on them in the **Fields** list. Each field can be configured with the following:

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Field type | The input type used to render the value. | Select from the supported field types in the dropdown. |
| Label | Display name shown as the key label. | String (e.g., `Full Name`). |
| Key | The property key in the data object this field maps to. | String (e.g., `full_name`). |
| Make editable | Enables inline editing for this field. | Enable/disable the toggle. |
| Visibility | Controls whether this field is visible. | Enable/disable the toggle. |

:::info
You can reorder fields by dragging them in the Fields list. Use the **Add new field** button to create fields that don't exist in the source data. The **Make all fields editable** toggle enables editing across all fields at once.
:::

### Dynamic Fields

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Use dynamic field | When enabled, fields are generated from a dynamic configuration array instead of the static field list. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Field data | Array of objects defining the fields dynamically. | Array of objects (e.g., `{{[{name: 'First name', key: 'firstName', fieldType: 'string'}, {name: 'Last name', key: 'lastName', fieldType: 'string'}]}}`). |

### Events

| Event | Description |
| :------------ | :---------- |
| Field clicked | Triggered when the user clicks on a field row. The `lastClickedField` variable is updated before this event fires. |
| Save changes | Triggered when the user clicks the **Save changes** button after editing one or more field values. |
| Field edited | Triggered each time the value of an editable field changes. The new value is added to `changeSet` before this event fires. |
| Cancel changes | Triggered when the user clicks **Cancel**, or when `resetChanges()` is called. Pending edits are discarded before this event fires. |

:::info
When **Show update buttons** is on and a user edits any field value, a popover appears at the bottom of the component with **Cancel** and **Save changes** buttons. Clicking **Cancel** discards all pending edits and fires **Cancel changes**. Clicking **Save changes** resets the change set and fires **Save changes**.

When **Show update buttons** is off, no buttons appear. Edits are still collected in `changeSet` and **Field edited** still fires, so you can save changes from the **Field edited** event and discard them with `resetChanges()`.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setVisibility() | Sets the visibility of the component. | `components.keyvaluepair1.setVisibility(false)` |
| setDisable() | Disables or enables the component. | `components.keyvaluepair1.setDisable(true)` |
| setLoading() | Sets the loading state of the component. | `components.keyvaluepair1.setLoading(true)` |
| resetChanges() | Discards all pending edits, restores the original values and fires the **Cancel changes** event. Available from RunJS; it isn't listed in the **Control component** action. | `components.keyvaluepair1.resetChanges()` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | Description | How To Access |
| :---------- | :---------- | :------------ |
| data | Holds the original data object passed to the component. | `{{components.keyvaluepair1.data}}` |
| changeSet | Contains only the fields that have been modified by the user but not yet saved. Returns an empty object when there are no pending changes. | `{{components.keyvaluepair1.changeSet}}` |
| lastClickedField | An object updated when a field row is clicked. Contains two fields: `key` (the field's data key) and `value` (the field's current value). Updated before the **Field clicked** event fires. | `{{components.keyvaluepair1.lastClickedField}}` |
| isLoading | Indicates if the component is in a loading state. | `{{components.keyvaluepair1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.keyvaluepair1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.keyvaluepair1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Show update buttons | Shows the **Cancel** and **Save changes** buttons when a field has unsaved edits. On by default. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Dynamic height | Automatically adjusts the component's height based on its content. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Collapse when hidden | Collapses the component's space when it is hidden, so surrounding components fill the space. Takes effect when the app runs (preview or released app), not on the editor canvas. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Supports **Plain text**, **Markdown**, and **HTML** formats. | String (e.g., `Customer details panel.`). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Label

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Color | Sets the color of the field labels. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Alignment | Sets the position of the label relative to the value field. | Click on the toggle options to select **Top** or **Side**. |
| Direction | Sets the alignment direction of side-positioned labels. Only visible when alignment is set to **Side**. | Click the left-align or right-align icon button. |
| Width | Sets the width of the label area. Only visible when alignment is set to **Side**. | Enable **Auto label width** for automatic sizing, or disable it to manually adjust the width using the slider. |

### Values

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Accent | Sets the accent color used for interactive elements like toggles and selections. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Text | Sets the text color of the field values. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Hover background | Sets the background of an editable field when the user hovers over it. | Select **Auto** to use the default hover color, or **Manual** to pick a color. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Padding inside | Sets the space between the component's border and its fields, in pixels. Defaults to `12`. Components added before this setting was introduced are set to `0`, so their layout doesn't change. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Background | Sets the background color of the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border | Sets the border color of the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border radius | Sets the radius of the component's corners, in pixels. Defaults to `6`. | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value. |
| Box shadow | Sets the box shadow properties of the component. | Select the box shadow color and adjust the related properties. |
| Padding | Controls the internal spacing of the component. | Select **Default** to use standard padding, or **None** to remove all padding. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
