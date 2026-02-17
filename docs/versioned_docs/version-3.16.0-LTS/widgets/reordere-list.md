---
id: reorderable-list
title: Reorderable List
---

The Reorderable List component allows users to arrange items in a custom order by dragging and dropping. It supports plain text, Markdown, and HTML content formats for list items.

## Example Usage

A logistics team needs a priority queue interface where dispatchers rearrange delivery stops based on real-time traffic updates and customer availability. The Reorderable List lets dispatchers drag items into the preferred delivery sequence, and the updated order is captured instantly through the **On change** event to sync with the routing system.

## Properties

### Options

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Dynamic options | Enables the use of dynamically generated options through a schema. When turned off, options can be added manually. | Enable/disable the toggle button. |
| Schema | Defines the list items when **Dynamic options** is enabled. Each item requires `label`, `value`, and optionally `format` (`plain`, `markdown`, or `html`). | Array of objects (e.g., `{{[{label: 'Card1', value: '1', format: 'plain'}]}}`). |

When **Dynamic options** is disabled, you can add items manually. Each item has the following fields:

| <div style={{ width:"100px"}}> Field </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> Expected Value </div>|
|:---------------|:-------------------------------------------------|:-----------------------------|
| Label | The display text for the list item. Supports plain text, Markdown, and HTML based on the format. | String (e.g., `Card1`). |
| Value | A unique identifier for the list item. | String (e.g., `1`). |
| Format | The rendering format for the label content. | `plain` (default), `markdown`, or `html`. |

### Example Code for Dynamic Options

```js
{{
    [
        { label: 'Card1', value: '1', format: 'plain' },
        { label: '**Bold Card**', value: '2', format: 'markdown' },
        { label: '<em>HTML Card</em>', value: '3', format: 'html' }
    ]
}}
```

## Events

**On change** <br/>
Triggered when items are reordered by dragging and dropping.

## Component Specific Actions (CSA)

Following actions of the component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setDisable()  | Disables or enables the component. | Employ a RunJS query (for e.g., <br/> `await components.reorderablelist1.setDisable(true)`) or trigger it using an event. |
| setLoading()  | Sets the loading state of the component. | Employ a RunJS query (for e.g., <br/> `await components.reorderablelist1.setLoading(true)`) or trigger it using an event. |
| setVisibility() | Sets the visibility of the component. | Employ a RunJS query (for e.g., <br/> `await components.reorderablelist1.setVisibility(false)`) or trigger it using an event. |

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:----------|:----------|:------------|
| options     | Holds the current list of items with their `label`, `value`, and `format` in the present order. | Accessible dynamically with JS (for e.g., `{{components.reorderablelist1.options}}`). |
| values      | Holds an array of `value` fields from the list items in the current order. | Accessible dynamically with JS (for e.g., `{{components.reorderablelist1.values}}`). |
| isVisible   | Indicates if the component is visible. | Accessible dynamically with JS (for e.g., `{{components.reorderablelist1.isVisible}}`). |
| isDisabled  | Indicates if the component is disabled. | Accessible dynamically with JS (for e.g., `{{components.reorderablelist1.isDisabled}}`). |
| isLoading   | Indicates if the component is in a loading state. | Accessible dynamically with JS (for e.g., `{{components.reorderablelist1.isLoading}}`). |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress.    | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility.                                                  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component. When disabled, drag-and-drop is prevented.   | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover. Set a string value for display.       | String (e.g., `Drag items to reorder.`).                       |

<div style={{paddingTop:'24px'}}>

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

---

## Styles

### Text

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:---------------|:------------|:---------------|
| Text      | Sets the text color for list items. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |

### Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
