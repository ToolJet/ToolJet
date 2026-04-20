---
id: reorderable-list
title: Reorderable List
---

The **Reorderable List** component allows users to arrange a list of items by dragging and dropping them into a desired order. It's useful for building prioritization interfaces, task ordering, or any workflow where the sequence of items matters.

Each item in the list supports plain text, Markdown, and HTML label formats, giving you flexibility in how items are displayed.

## Example Usage

A project manager needs to build a sprint planning board where the team can prioritize backlog items. Using the Reorderable List component, team members can drag tasks up or down to set their priority order. The updated order is captured via the `On change` event and can be saved back to the database.

## Properties

The list items can be configured either statically or dynamically.

To add a **Static options** click on **+ Add new option** button and then configure the item with a label, value, and format.

To use **dynamic options**, enable the **Dynamic options** toggle and provide a schema. The schema accepts an array of objects, each with `label`, `value`, and `format` properties.

<details id="tj-dropdown">
<summary>**Schema Example**</summary>

```json
[
  { "label": "Card1", "value": "1", "format": "plain" },
  { "label": "Card2", "value": "2", "format": "plain" },
  { "label": "**Bold Card**", "value": "3", "format": "markdown" }
]
```

</details>

## Events

| Event     | Description                                              |
| :-------- | :------------------------------------------------------- |
| On change | Triggers whenever an item is reordered via drag and drop. |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA). You can trigger these using an event or through a RunJS query.

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :------------ | :---------- | :------------ |
| setVisibility | Sets the visibility of the component.    | `components.reorderablelist1.setVisibility(false)` |
| setDisable    | Disables the component.                  | `components.reorderablelist1.setDisable(true)`     |
| setLoading    | Sets the loading state of the component. | `components.reorderablelist1.setLoading(true)`     |

## Exposed Variables

| Variable   | <div style={{ width:"250px"}}> Description </div>                                    | How To Access                                    |
| :--------- | :----------------------------------------------------------------------------------- | :----------------------------------------------- |
| options    | Holds the current list of items in their present order, including label, value, and format. | `{{components.reorderablelist1.options}}`   |
| values     | Holds an array of values from the list items in their current order.                  | `{{components.reorderablelist1.values}}`         |
| isVisible  | Indicates if the component is visible.                                                | `{{components.reorderablelist1.isVisible}}`      |
| isDisabled | Indicates if the component is disabled.                                               | `{{components.reorderablelist1.isDisabled}}`     |
| isLoading  | Indicates if the component is loading.                                                | `{{components.reorderablelist1.isLoading}}`      |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Loading state | Enables a loading spinner, often used with `isLoading` to indicate progress. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility | Controls component visibility. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable | Enables or disables the component. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Set a string value for display. | String (e.g., `Drag items to reorder.`). |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

### Text

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div> |
| :---------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| Text | Sets the text color of the list items. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Padding | Adds padding between the component content and its container boundary. | Select `Default` for standard padding or `None` to remove padding. |

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)