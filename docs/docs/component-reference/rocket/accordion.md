---
id: accordion
title: Accordion
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Accordion** component shows a list of sections with a title each, where the user opens a section to read its text. Use it for FAQs, help text or details that should stay out of the way until needed.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The sections to show, as a list of objects with a `title` and `content`. Add a `value` to name a section for **Open item (value)** and the **Open item** action. | Array |
| Several open at once | Lets the user keep several sections open at the same time. When off, opening a section closes the one that was open. | On or off. Default: Off |
| Open by default (indexes) | Positions of the sections that start open, counting from `0`, such as `[0]` for the first section. | Array |
| Open item (value) | Opens the section whose `value` matches. It also updates to the value of the first open section as the user opens and closes them. | Text |
| Loading look | What shows while the component is loading: a **Spinner** or a grey **Skeleton** block. | Spinner, Skeleton. Default: Spinner |

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
| Expand | Opens the section at **Index (empty: all)**, or every section when the index is empty. With **Several open at once** off, it opens one section only. | `components.accordion1.expand("")` |
| Collapse | Closes the section at **Index (empty: all)**, or every section when the index is empty. | `components.accordion1.collapse("")` |
| Open item | Opens the section whose `value` matches **Item value**. | `components.accordion1.open("")` |
| Collapse all | Closes every section. | `components.accordion1.collapseAll()` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Item title color | Theme: Primary text |
| Item content color | Theme: Placeholder text |
| Divider color | Theme: Default border |
| Chevron color | Theme: Placeholder text |
| Divider (legacy) | — |
