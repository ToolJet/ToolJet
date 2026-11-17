---
id: badge
title: Badge
---

<div className="badge badge--primary">Ant Design</div>

The **Badge** component shows a small status dot with a label, such as Pending or Active, or a count bubble for things like unread items.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Status | Color of the dot. `processing` is blue and pulses, `default` is gray. | `default`, `processing`, `success`, `warning`, `error`. Default: `default` |
| Text | Label shown next to the dot or the count. | Text. Default: `Pending` |
| Count | A number to show in a bubble in place of the status dot. Leave it empty to show the dot. | Number |
| Overflow count | Highest number the count bubble shows. Larger counts show as this number with a plus, such as `99+`. | Number. Default: `99` |
| Color | A color name such as `blue` or any CSS color for the dot or bubble. It overrides **Status**. | Text |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |
| Dynamic height | Lets the component grow with its content in the running app instead of keeping a fixed height. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.badge1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.badge1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.badge1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `status` | Color of the dot. `processing` is blue and pulses, `default` is gray. | `{{components.badge1.status}}` |
| `text` | Label shown next to the dot or the count. | `{{components.badge1.text}}` |
| `count` | A number to show in a bubble in place of the status dot. Leave it empty to show the dot. | `{{components.badge1.count}}` |
| `overflowCount` | Highest number the count bubble shows. Larger counts show as this number with a plus, such as `99+`. | `{{components.badge1.overflowCount}}` |
| `color` | A color name such as `blue` or any CSS color for the dot or bubble. It overrides **Status**. | `{{components.badge1.color}}` |
| `isVisible` | Whether the component is visible. | `{{components.badge1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.badge1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.badge1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
