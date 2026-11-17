---
id: icon
title: Icon
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Icon** component shows a single icon, optionally on a colored chip. Use it to mark a status, label a metric or act as a small clickable control.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Icon | Icon to show, by its Lucide name, such as `trending-up` or `bell`. | Text. Default: `trending-up` |
| Icon size (px) | Size of the icon, in pixels. | Number. Default: `20` |
| Stroke width | Thickness of the icon's lines. | Number. Default: `2` |
| Tone (unless Icon color is set) | Color of the icon. It is ignored once **Icon color** is set. | `default`, `muted`, `primary`, `success`, `warning`, `destructive`. Default: `primary` |
| Background chip | Shape of the background behind the icon: **None**, **Circle** or **Rounded square**. | None, Circle, Rounded square. Default: Rounded square |
| Chip size (px, empty: icon x 2) | Size of the chip, in pixels. Leave it empty for twice the icon size. | Text |
| Loading look | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | Spinner, Skeleton. Default: Spinner |

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
| On click | Triggers when the user clicks the icon. |
| On hover | Triggers when the pointer moves onto the icon. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Click | Fires the icon's **On click** event. | `components.icon1.click()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.icon1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.icon1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.icon1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `icon` | Icon to show, by its Lucide name, such as `trending-up` or `bell`. | `{{components.icon1.icon}}` |
| `size` | Size of the icon, in pixels. | `{{components.icon1.size}}` |
| `strokeWidth` | Thickness of the icon's lines. | `{{components.icon1.strokeWidth}}` |
| `tone` | Color of the icon. It is ignored once **Icon color** is set. | `{{components.icon1.tone}}` |
| `chip` | Shape of the background behind the icon: **None**, **Circle** or **Rounded square**. | `{{components.icon1.chip}}` |
| `chipSize` | Size of the chip, in pixels. Leave it empty for twice the icon size. | `{{components.icon1.chipSize}}` |
| `loadingIndicator` | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | `{{components.icon1.loadingIndicator}}` |
| `isVisible` | Whether the component is visible. | `{{components.icon1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.icon1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.icon1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Icon color | Theme: Brand primary |
| Chip background (default: icon color tint) | Theme: Brand primary |
| Chip radius (square chip) | — |
| Alignment | `left` |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
