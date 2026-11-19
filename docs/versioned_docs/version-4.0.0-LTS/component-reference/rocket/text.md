---
id: text
title: Text
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Text** component shows a line or paragraph of plain text, such as a description, an instruction or a value from a query.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text to show. | Text. Default: `Text` |
| Style | Preset look of the text. **Lead** is larger for an intro, **Muted** is gray for secondary notes, and **Small** and **Large** change the size. | Paragraph, Lead, Muted, Small, Large. Default: Paragraph |
| Loading look | What shows while the component is loading: a spinner or skeleton lines. | Spinner, Skeleton. Default: Spinner |

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
| On click | Triggers when the user clicks the text. |
| On hover | Triggers when the pointer moves onto the text. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Changes the text shown until the **Text** property changes. | `components.text1.setText("New text")` |
| Clear | Empties the text. | `components.text1.clear()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.text1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.text1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.text1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `text` | Text to show. | `{{components.text1.text}}` |
| `tone` | Preset look of the text. **Lead** is larger for an intro, **Muted** is gray for secondary notes, and **Small** and **Large** change the size. | `{{components.text1.tone}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or skeleton lines. | `{{components.text1.loadingIndicator}}` |
| `isVisible` | Whether the component is visible. | `{{components.text1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.text1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.text1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Text color | Theme: Primary text |
| Text alignment (left, center, right) | `left` |
| Typeface | Theme font |
| Weight | — |
| Letter spacing (px, or em like 0.12em) | — |
| Casing | As typed |
| Font size (px) | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
