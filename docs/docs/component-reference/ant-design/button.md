---
id: button
title: Button
---

<div className="badge badge--primary">Ant Design</div>

The **Button** component is Ant Design's button. It runs an action when clicked, such as submitting a form or running a query, or opens a link when **Href** is set.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown on the button. | Text. Default: `Button` |
| Color | Color of the button. Use `danger` for actions that delete or remove data. | `primary`, `default`, `danger`. Default: `primary` |
| Variant | Fill style. `solid` is filled, `outlined` and `dashed` have a border, `filled` has a light fill, and `text` and `link` have no border. | `solid`, `outlined`, `dashed`, `filled`, `text`, `link`. Default: `solid` |
| Size | Height and text size of the button. | `small`, `middle`, `large`. Default: `middle` |
| Shape | `round` gives the button fully rounded ends. | `default`, `round`. Default: `default` |
| Block | Makes the button fill the width of its box. | On or off. Default: On |
| Href | A URL to open when the button is clicked. The button then behaves as a link. | Text |
| Target | Where **Href** opens: `_blank` for a new tab, `_self` for the same tab. | `_self`, `_blank`. Default: `_blank` |

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
| On click | Triggers when the user clicks the button. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Click | Clicks the button, which fires its **On click** event. | `components.button1.click()` |
| Focus | Moves keyboard focus to the button. | `components.button1.focus()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.button1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.button1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.button1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text shown on the button. | `{{components.button1.children}}` |
| `color` | Color of the button. Use `danger` for actions that delete or remove data. | `{{components.button1.color}}` |
| `variant` | Fill style. `solid` is filled, `outlined` and `dashed` have a border, `filled` has a light fill, and `text` and `link` have no border. | `{{components.button1.variant}}` |
| `size` | Height and text size of the button. | `{{components.button1.size}}` |
| `shape` | `round` gives the button fully rounded ends. | `{{components.button1.shape}}` |
| `block` | Makes the button fill the width of its box. | `{{components.button1.block}}` |
| `href` | A URL to open when the button is clicked. The button then behaves as a link. | `{{components.button1.href}}` |
| `target` | Where **Href** opens: `_blank` for a new tab, `_self` for the same tab. | `{{components.button1.target}}` |
| `isVisible` | Whether the component is visible. | `{{components.button1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.button1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.button1.isDisabled}}` |

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
