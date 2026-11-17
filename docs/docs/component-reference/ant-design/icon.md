---
id: icon
title: Icon
---

<div className="badge badge--primary">Ant Design</div>

The **Icon** component shows a single icon, optionally on a tinted circle or square, such as a marker beside a heading or a clickable shortcut.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Icon | The icon to show, by its Ant Design name, such as `TeamOutlined`, or a plain word, such as `users`, `cart` or `rocket`. | Text. Default: `StarOutlined` |
| Size (px) | Size of the icon, from 8 to 200 pixels. | Number. Default: `20` |
| Type | Color of the icon. `muted` is a light gray; the others use the theme's colors. | `default`, `muted`, `primary`, `success`, `warning`, `danger`. Default: `default` |
| Chip | Puts the icon on a lightly tinted `circle` or `square` in the icon's color. | `none`, `circle`, `square`. Default: `none` |
| Chip size (px) | Width and height of the chip in pixels. It shrinks to fit a smaller box. | Number. Default: `40` |

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
| `icon` | The icon to show, by its Ant Design name, such as `TeamOutlined`, or a plain word, such as `users`, `cart` or `rocket`. | `{{components.icon1.icon}}` |
| `size` | Size of the icon, from 8 to 200 pixels. | `{{components.icon1.size}}` |
| `type` | Color of the icon. `muted` is a light gray; the others use the theme's colors. | `{{components.icon1.type}}` |
| `chip` | Puts the icon on a lightly tinted `circle` or `square` in the icon's color. | `{{components.icon1.chip}}` |
| `chipSize` | Width and height of the chip in pixels. It shrinks to fit a smaller box. | `{{components.icon1.chipSize}}` |
| `isVisible` | Whether the component is visible. | `{{components.icon1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.icon1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.icon1.isDisabled}}` |

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
