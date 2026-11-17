---
id: accordion-container
title: Accordion Container
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Accordion Container** component groups other components into collapsible sections, each with its own title. Use it to break a long settings page or form into parts the user can open one at a time.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Sections | The sections to show, as a list of objects with an `id` and a `title`. Keep each `id` the same over time, since the components dropped into a section stay with its `id`. | Array |
| Open sections | The `id`s of the sections that are open. It updates as the user opens and closes sections. | Array. Default: `["general"]` |
| Allow several open | Lets the user keep several sections open at the same time. When off, opening a section closes the one that was open. | On or off. Default: On |

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
| On change | Triggers when the set of open sections changes. |
| On expand | Triggers when a section opens. |
| On collapse | Triggers when a section closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Expand | Opens the section named by **Section id or index (empty: all)**, or every section when it is empty. | `components.accordioncontainer1.expand("")` |
| Collapse | Closes the section named by **Section id or index (empty: all)**, or every section when it is empty. | `components.accordioncontainer1.collapse("")` |
| Open section | Opens the section whose `id` matches **Section id**. | `components.accordioncontainer1.openSection("")` |
| Collapse all | Closes every section. | `components.accordioncontainer1.collapseAll()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.accordioncontainer1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.accordioncontainer1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.accordioncontainer1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `sections` | The sections to show, as a list of objects with an `id` and a `title`. Keep each `id` the same over time, since the components dropped into a section stay with its `id`. | `{{components.accordioncontainer1.sections}}` |
| `openSections` | The `id`s of the sections that are open. It updates as the user opens and closes sections. | `{{components.accordioncontainer1.openSections}}` |
| `allowMultiple` | Lets the user keep several sections open at the same time. When off, opening a section closes the one that was open. | `{{components.accordioncontainer1.allowMultiple}}` |
| `isExpanded` | `true` when at least one section is open. | `{{components.accordioncontainer1.isExpanded}}` |
| `openIndexes` | Positions of the open sections, counting from `0`. | `{{components.accordioncontainer1.openIndexes}}` |
| `isVisible` | Whether the component is visible. | `{{components.accordioncontainer1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.accordioncontainer1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.accordioncontainer1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Section height | `160` |
| Header text (legacy) | — |
| Item title color | Theme: Primary text |
| Divider color | Theme: Default border |
| Chevron color | Theme: Placeholder text |
| Background | Theme: Surface 1 |
| Border radius | — |
| Padding | `12` |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
