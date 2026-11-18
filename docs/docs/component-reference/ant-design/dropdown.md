---
id: dropdown
title: Dropdown
---

<div className="badge badge--primary">Ant Design</div>

The **Dropdown** component is a button that opens a menu of actions, such as Edit, Duplicate and Delete for a record.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown on the button. | Text. Default: `Actions` |
| Menu items | The menu entries, as a list of `{key, label}`. Add `danger: true` to show an entry in red, for actions that delete or remove data. | Array |
| Type | `primary` fills the button with the theme color; `default` has a border. | `default`, `primary`. Default: `default` |
| Split button | Splits the button in two: the main part runs its own action and an arrow part opens the menu. | On or off. Default: Off |
| Trigger | Whether the menu opens when the user clicks the button or hovers over it. | `click`, `hover`. Default: `click` |
| Placement | Where the menu opens relative to the button. | `bottomLeft`, `bottom`, `bottomRight`, `topLeft`, `top`, `topRight`. Default: `bottomLeft` |
| Arrow | Shows a small arrow on the menu that points at the button. | On or off. Default: Off |
| Block | Makes the button fill the width of its box. | On or off. Default: Off |

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
| On click | Triggers when the user picks a menu entry. |
| On button click | Triggers when the user clicks the main part of a split button. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.dropdown1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.dropdown1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.dropdown1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text shown on the button. | `{{components.dropdown1.children}}` |
| `items` | The menu entries, as a list of `{key, label}`. Add `danger: true` to show an entry in red, for actions that delete or remove data. | `{{components.dropdown1.items}}` |
| `type` | `primary` fills the button with the theme color; `default` has a border. | `{{components.dropdown1.type}}` |
| `split` | Splits the button in two: the main part runs its own action and an arrow part opens the menu. | `{{components.dropdown1.split}}` |
| `trigger` | Whether the menu opens when the user clicks the button or hovers over it. | `{{components.dropdown1.trigger}}` |
| `placement` | Where the menu opens relative to the button. | `{{components.dropdown1.placement}}` |
| `arrow` | Shows a small arrow on the menu that points at the button. | `{{components.dropdown1.arrow}}` |
| `block` | Makes the button fill the width of its box. | `{{components.dropdown1.block}}` |
| `selectedKey` | Key of the menu entry the user picked last. | `{{components.dropdown1.selectedKey}}` |
| `isVisible` | Whether the component is visible. | `{{components.dropdown1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.dropdown1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.dropdown1.isDisabled}}` |

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
