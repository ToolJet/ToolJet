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
| Save changes | Triggered when the user clicks the **Save changes** button after editing one or more field values. |

:::info
When a user edits any field value, a popover appears at the bottom of the component with **Cancel** and **Save changes** buttons. Clicking **Cancel** discards all pending edits. Clicking **Save changes** fires the event and resets the change set.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| setVisibility() | Sets the visibility of the component. | `components.keyvaluepair1.setVisibility(false)` |
| setDisable() | Disables or enables the component. | `components.keyvaluepair1.setDisable(true)` |
| setLoading() | Sets the loading state of the component. | `components.keyvaluepair1.setLoading(true)` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | Description | How To Access |
| :---------- | :---------- | :------------ |
| data | Holds the original data object passed to the component. | `{{components.keyvaluepair1.data}}` |
| changeSet | Contains only the fields that have been modified by the user but not yet saved. Returns an empty object when there are no pending changes. | `{{components.keyvaluepair1.changeSet}}` |
| isLoading | Indicates if the component is in a loading state. | `{{components.keyvaluepair1.isLoading}}` |
| isVisible | Indicates if the component is visible. | `{{components.keyvaluepair1.isVisible}}` |
| isDisabled | Indicates if the component is disabled. | `{{components.keyvaluepair1.isDisabled}}` |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String (e.g., `Customer details panel.`). |

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
| Width | Sets the width of the label area. Only visible when alignment is set to **Side**. | Enable **Auto width** for automatic sizing, or disable it to manually adjust the width using the slider. |

### Values

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Accent | Sets the accent color used for interactive elements like toggles and selections. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Text | Sets the text color of the field values. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |

### Container

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :--------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Padding | Controls the internal spacing of the component. | Select **Default** to use standard padding, or **None** to remove all padding. |

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
