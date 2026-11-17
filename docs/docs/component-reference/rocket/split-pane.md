---
id: split-pane
title: Split Pane
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Split Pane** component is a container with two areas and a divider the user can drag to resize them, such as a list beside a detail view. Drop other components into either area.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Direction | **Side by side** places the two areas left and right; **Stacked** places them top and bottom. | Side by side, Stacked. Default: Side by side |
| First pane (%) | Size of the first area as a percent of the whole. It updates as the user drags the divider. | Number. Default: `40` |
| Minimum pane (%) | Smallest size, as a percent, either area can be dragged down to. Capped at `45`. | Number. Default: `15` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On resize](../common-settings.md#events) | Triggers when the user finishes moving the divider, by dragging it or with the keyboard. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set split | Moves the divider so the first area takes the given percent, kept within **Minimum pane (%)**. | `components.splitpane1.setSplit("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `direction` | **Side by side** places the two areas left and right; **Stacked** places them top and bottom. | `{{components.splitpane1.direction}}` |
| `split` | Size of the first area as a percent of the whole. It updates as the user drags the divider. | `{{components.splitpane1.split}}` |
| `minPane` | Smallest size, as a percent, either area can be dragged down to. Capped at `45`. | `{{components.splitpane1.minPane}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Divider | Theme: Default border |
| Divider width | `6` |
| Background | Theme: Surface 1 |
| Border radius | — |
| Padding | `12` |
