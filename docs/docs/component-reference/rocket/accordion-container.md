---
id: accordion-container
title: Accordion Container
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Accordion Container** component groups other components into collapsible sections, each with its own title. Use it to break a long settings page or form into parts the user can open one at a time.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Sections | The sections to show, as a list of objects with an `id` and a `title`. Keep each `id` the same over time, since the components you drop into a section stay with its `id`. | Array |
| Open sections | The `id`s of the sections that are open. It updates as the user opens and closes sections. | Array. Default: `["general"]` |
| Allow several open | Lets the user keep several sections open at the same time. When off, opening a section closes the one that was open. | On or off. Default: On |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the set of open sections changes. |
| [On expand](../common-settings.md#events) | Triggers when a section opens. |
| [On collapse](../common-settings.md#events) | Triggers when a section closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Expand | Opens the section named by **Section id or index (empty: all)**, or every section when it is empty. | `components.accordioncontainer1.expand("")` |
| Collapse | Closes the section named by **Section id or index (empty: all)**, or every section when it is empty. | `components.accordioncontainer1.collapse("")` |
| Open section | Opens the section whose `id` matches **Section id**. | `components.accordioncontainer1.openSection("")` |
| Collapse all | Closes every section. | `components.accordioncontainer1.collapseAll()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `sections` | The sections to show, as a list of objects with an `id` and a `title`. Keep each `id` the same over time, since the components you drop into a section stay with its `id`. | `{{components.accordioncontainer1.sections}}` |
| `openSections` | The `id`s of the sections that are open. It updates as the user opens and closes sections. | `{{components.accordioncontainer1.openSections}}` |
| `allowMultiple` | Lets the user keep several sections open at the same time. When off, opening a section closes the one that was open. | `{{components.accordioncontainer1.allowMultiple}}` |
| `isExpanded` | `true` when at least one section is open. | `{{components.accordioncontainer1.isExpanded}}` |
| `openIndexes` | Positions of the open sections, counting from `0`. | `{{components.accordioncontainer1.openIndexes}}` |

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
