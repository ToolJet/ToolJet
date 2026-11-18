---
id: menu
title: Menu
---

<div className="badge badge--primary">Ant Design</div>

The **Menu** component shows a list of navigation links, as a sidebar or a top bar, with optional submenus. Use it to move between sections of an app.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The menu entries, as a list of `{key, label}`. Add `children` with more entries to make a submenu. | Array |
| Mode | `inline` is a sidebar with submenus that expand in place; `vertical` is a sidebar with submenus that open to the side; `horizontal` is a top bar, with entries that don't fit moved into a `...` menu. | `horizontal`, `vertical`, `inline`. Default: `inline` |
| Theme | Light or dark background. | `light`, `dark`. Default: `light` |
| Selected key | Key of the entry shown as selected. It updates when the user clicks an entry. | Text |

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
| On click | Triggers when the user clicks a menu entry. |
| On select | Triggers when the user selects a menu entry. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select item | Marks the entry with the given **Key** as selected, without firing any events. | `components.menu1.setSelectedKey("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.menu1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.menu1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.menu1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The menu entries, as a list of `{key, label}`. Add `children` with more entries to make a submenu. | `{{components.menu1.items}}` |
| `mode` | `inline` is a sidebar with submenus that expand in place; `vertical` is a sidebar with submenus that open to the side; `horizontal` is a top bar, with entries that don't fit moved into a `...` menu. | `{{components.menu1.mode}}` |
| `theme` | Light or dark background. | `{{components.menu1.theme}}` |
| `selectedKey` | Key of the entry shown as selected. It updates when the user clicks an entry. | `{{components.menu1.selectedKey}}` |
| `isVisible` | Whether the component is visible. | `{{components.menu1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.menu1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.menu1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
