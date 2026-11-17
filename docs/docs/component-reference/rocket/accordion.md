---
id: accordion
title: Accordion
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Accordion** component shows a list of sections with a title each, where the user opens a section to read its text. Use it for FAQs, help text or details that should stay out of the way until needed.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The sections to show, as a list of objects with a `title` and `content`. Add a `value` to name a section for **Open item (value)** and the **Open item** action. | Array |
| Several open at once | Lets the user keep several sections open at the same time. When off, opening a section closes the one that was open. | On or off. Default: Off |
| Open by default (indexes) | Positions of the sections that start open, counting from `0`, such as `[0]` for the first section. | Array |
| Open item (value) | Opens the section whose `value` matches. It also updates to the value of the first open section as the user opens and closes them. | Text |
| Loading look | What shows while the component is loading: a **Spinner** or a grey **Skeleton** block. | Spinner, Skeleton. Default: Spinner |

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
| On change | Triggers when the set of open sections changes. |
| On expand | Triggers when a section opens. |
| On collapse | Triggers when a section closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Expand | Opens the section at **Index (empty: all)**, or every section when the index is empty. With **Several open at once** off, it opens one section only. | `components.accordion1.expand("")` |
| Collapse | Closes the section at **Index (empty: all)**, or every section when the index is empty. | `components.accordion1.collapse("")` |
| Open item | Opens the section whose `value` matches **Item value**. | `components.accordion1.open("")` |
| Collapse all | Closes every section. | `components.accordion1.collapseAll()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.accordion1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.accordion1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.accordion1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The sections to show, as a list of objects with a `title` and `content`. Add a `value` to name a section for **Open item (value)** and the **Open item** action. | `{{components.accordion1.items}}` |
| `multiple` | Lets the user keep several sections open at the same time. When off, opening a section closes the one that was open. | `{{components.accordion1.multiple}}` |
| `defaultOpen` | Positions of the sections that start open, counting from `0`, such as `[0]` for the first section. | `{{components.accordion1.defaultOpen}}` |
| `value` | Opens the section whose `value` matches. It also updates to the value of the first open section as the user opens and closes them. | `{{components.accordion1.value}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a grey **Skeleton** block. | `{{components.accordion1.loadingIndicator}}` |
| `openIndexes` | Positions of the open sections, counting from `0`. | `{{components.accordion1.openIndexes}}` |
| `isExpanded` | `true` when at least one section is open. | `{{components.accordion1.isExpanded}}` |
| `isVisible` | Whether the component is visible. | `{{components.accordion1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.accordion1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.accordion1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Item title color | Theme: Primary text |
| Item content color | Theme: Placeholder text |
| Divider color | Theme: Default border |
| Chevron color | Theme: Placeholder text |
| Divider (legacy) | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
