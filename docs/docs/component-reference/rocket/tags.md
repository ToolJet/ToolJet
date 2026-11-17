---
id: tags
title: Tags
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Tags** component shows a read-only list of labels as colored chips, such as the categories, skills or statuses attached to a record. The user can click a tag to act on it.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Tags (array or comma-separated) | Tags to show, as a list or comma-separated text. Each can be plain text or an item with a `label` and a `color`. | Array. Default: `["Design", "Frontend", "Urgent"]` |
| Colours by tag | A color for each tag, for example `{ "Urgent": "#dc2626" }`. A tag's own `color` wins. | Object. Default: `{"Urgent": "#dc2626"}` |
| Variant | Fill style of the chips: a light **Soft** tint, an **Outline**, or a **Solid** fill. | Soft, Outline, Solid. Default: Soft |
| Size | Size of the chips. | Sm, Default, Lg. Default: Default |
| Overflow | What happens when the tags don't fit: **Wrap** onto more lines, show **One line, +N** with a count of the rest, or **Scroll** sideways on one line. | Wrap, One line, +N, Scroll. Default: Wrap |
| Pill shape | Gives the chips fully rounded ends. | On or off. Default: Off |
| Loading look | What shows while the component is loading: a spinner or skeleton chips. | Spinner, Skeleton. Default: Spinner |

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
| On tag clicked | Triggers when the user clicks a tag. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.tags1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.tags1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.tags1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `tags` | Tags to show, as a list or comma-separated text. Each can be plain text or an item with a `label` and a `color`. | `{{components.tags1.tags}}` |
| `tagColors` | A color for each tag, for example `{ "Urgent": "#dc2626" }`. A tag's own `color` wins. | `{{components.tags1.tagColors}}` |
| `variant` | Fill style of the chips: a light **Soft** tint, an **Outline**, or a **Solid** fill. | `{{components.tags1.variant}}` |
| `size` | Size of the chips. | `{{components.tags1.size}}` |
| `overflow` | What happens when the tags don't fit: **Wrap** onto more lines, show **One line, +N** with a count of the rest, or **Scroll** sideways on one line. | `{{components.tags1.overflow}}` |
| `pill` | Gives the chips fully rounded ends. | `{{components.tags1.pill}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or skeleton chips. | `{{components.tags1.loadingIndicator}}` |
| `lastClickedTag` | The label of the tag the user clicked last. | `{{components.tags1.lastClickedTag}}` |
| `isVisible` | Whether the component is visible. | `{{components.tags1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.tags1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.tags1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Tag background (unmapped tags) | Theme: Surface 3 |
| Tag text color (unmapped tags) | Theme: Primary text |
| Tag border color | `transparent` |
| Tag radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
