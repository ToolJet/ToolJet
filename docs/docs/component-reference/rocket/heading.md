---
id: heading
title: Heading
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Heading** component shows a title for a page or section of an app. Text that doesn't fit its box ends in an ellipsis, with the full text on hover.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown in the heading. | Text. Default: `Heading` |
| Level | Heading level, from `H1` (largest) to `H4`. It also sets the font size unless **Font size** is changed. | H1, H2, H3, H4. Default: H2 |
| Loading look | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | Spinner, Skeleton. Default: Spinner |

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

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On click | Triggers when the user clicks the heading. |
| On hover | Triggers when the pointer moves onto the heading. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Changes the heading's text to **Text**. | `components.heading1.setText("New text")` |
| Clear | Empties the heading's text. | `components.heading1.clear()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.heading1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.heading1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.heading1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `text` | Text shown in the heading. | `{{components.heading1.text}}` |
| `level` | Heading level, from `H1` (largest) to `H4`. It also sets the font size unless **Font size** is changed. | `{{components.heading1.level}}` |
| `loadingIndicator` | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | `{{components.heading1.loadingIndicator}}` |
| `isVisible` | Whether the component is visible. | `{{components.heading1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.heading1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.heading1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Heading color | Theme: Primary text |
| Text alignment (left, center, right) | `left` |
| Typeface | Theme font |
| Weight | — |
| Letter spacing (px, or em like 0.12em) | — |
| Casing | As typed |
| Font size (px; default from the level) | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
