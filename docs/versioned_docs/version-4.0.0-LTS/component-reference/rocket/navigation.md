---
id: navigation
title: Navigation
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Navigation** component is a sidebar or top bar of menu items for moving between sections of an app, such as **Dashboard**, **Orders** and **Settings**. Items can have icons, badges, group headings and one level of child items.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | Items in the menu. Each item has a `label` and a `value`, and can add an `icon`, `badge`, `group`, `disabled`, `visible`, `separator` or `children`. | Array |
| Active item (value) | Value of an item to make active. When this changes, the active item moves to it without firing **On click**. | Text |
| Selected item | Value of the item that is active. | Text. Default: `dashboard` |
| Orientation | **Vertical** shows a sidebar; **Horizontal** shows a top bar where items with children open as dropdowns. | Vertical, Horizontal. Default: Vertical |
| Variant | How the active item is marked. **Pills** fills it, **Underline** draws a line under it and **Ghost** keeps it light. | Pills, Underline, Ghost. Default: Pills |
| Size | Height and text size of the items. | Sm, Default, Lg. Default: Default |
| Align (top bar) | Where the items sit in a horizontal top bar. **Stretch** spreads them across the full width. | Start, Center, End, Stretch. Default: Start |
| Collapsed (icon-only sidebar) | Shrinks a vertical sidebar to a narrow rail that shows only icons. Items with children open as a dropdown. | On or off. Default: Off |
| Show collapse button | Shows a button at the end of a vertical sidebar that collapses and expands it. | On or off. Default: Off |
| Loading look | What shows while the component is loading: a spinner or a skeleton outline of the menu. | Spinner, Skeleton. Default: Spinner |

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
| On click | Triggers when the user clicks an item. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select item | Makes the item with the given **Item value** active. | `components.navigation1.selectItem("")` |
| Set item visibility | Shows or hides the item with the given **Item value** until **Items** changes. | `components.navigation1.setItemVisibility("", "{{true}}")` |
| Set item disable | Disables or enables the item with the given **Item value** until **Items** changes. | `components.navigation1.setItemDisable("", "{{true}}")` |
| Set collapsed | Collapses the sidebar to icons only, or expands it. | `components.navigation1.setCollapsed("{{true}}")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.navigation1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.navigation1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.navigation1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | Items in the menu. Each item has a `label` and a `value`, and can add an `icon`, `badge`, `group`, `disabled`, `visible`, `separator` or `children`. | `{{components.navigation1.items}}` |
| `defaultValue` | Value of an item to make active. When this changes, the active item moves to it without firing **On click**. | `{{components.navigation1.defaultValue}}` |
| `value` | Value of the item that is active. | `{{components.navigation1.value}}` |
| `orientation` | **Vertical** shows a sidebar; **Horizontal** shows a top bar where items with children open as dropdowns. | `{{components.navigation1.orientation}}` |
| `variant` | How the active item is marked. **Pills** fills it, **Underline** draws a line under it and **Ghost** keeps it light. | `{{components.navigation1.variant}}` |
| `size` | Height and text size of the items. | `{{components.navigation1.size}}` |
| `align` | Where the items sit in a horizontal top bar. **Stretch** spreads them across the full width. | `{{components.navigation1.align}}` |
| `collapsed` | Shrinks a vertical sidebar to a narrow rail that shows only icons. Items with children open as a dropdown. | `{{components.navigation1.collapsed}}` |
| `showCollapseButton` | Shows a button at the end of a vertical sidebar that collapses and expands it. | `{{components.navigation1.showCollapseButton}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or a skeleton outline of the menu. | `{{components.navigation1.loadingIndicator}}` |
| `selectedItem` | The active item, with its `label` and `value`. | `{{components.navigation1.selectedItem}}` |
| `previousSelectedItem` | The item that was active before the current one. | `{{components.navigation1.previousSelectedItem}}` |
| `isCollapsed` | Whether the sidebar is collapsed to icons only. | `{{components.navigation1.isCollapsed}}` |
| `isVisible` | Whether the component is visible. | `{{components.navigation1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.navigation1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.navigation1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Background | `transparent` |
| Item text color | Theme: Primary text |
| Item icon color | Theme: Primary text |
| Item hover background | Theme: Surface 3 |
| Active item background | Theme: Surface 3 |
| Active item text color | Theme: Primary text |
| Active indicator color (underline) | Theme: Brand primary |
| Badge background | Theme: Surface 3 |
| Badge text color | Theme: Placeholder text |
| Group heading color | Theme: Placeholder text |
| Separator color | Theme: Default border |
| Item radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
