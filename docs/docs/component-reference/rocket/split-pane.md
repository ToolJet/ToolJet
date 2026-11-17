---
id: split-pane
title: Split Pane
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Split Pane** component is a container with two areas and a divider the user can drag to resize them, such as a list beside a detail view. Drop other components into either area.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Direction | **Side by side** places the two areas left and right; **Stacked** places them top and bottom. | Side by side, Stacked. Default: Side by side |
| First pane (%) | Size of the first area as a percent of the whole. It updates as the user drags the divider. | Number. Default: `40` |
| Minimum pane (%) | Smallest size, as a percent, either area can be dragged down to. Capped at `45`. | Number. Default: `15` |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On resize | Triggers when the user finishes moving the divider, by dragging it or with the keyboard. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set split | Moves the divider so the first area takes the given percent, kept within **Minimum pane (%)**. | `components.splitpane1.setSplit("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.splitpane1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.splitpane1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.splitpane1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `direction` | **Side by side** places the two areas left and right; **Stacked** places them top and bottom. | `{{components.splitpane1.direction}}` |
| `split` | Size of the first area as a percent of the whole. It updates as the user drags the divider. | `{{components.splitpane1.split}}` |
| `minPane` | Smallest size, as a percent, either area can be dragged down to. Capped at `45`. | `{{components.splitpane1.minPane}}` |
| `isVisible` | Whether the component is visible. | `{{components.splitpane1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.splitpane1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.splitpane1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Divider | Theme: Default border |
| Divider width | `6` |
| Background | Theme: Surface 1 |
| Border radius | — |
| Padding | `12` |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
