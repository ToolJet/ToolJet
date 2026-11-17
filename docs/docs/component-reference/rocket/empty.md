---
id: empty
title: Empty
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Empty** component shows an icon, a title and a short message for a place with nothing to show yet, such as a search with no results or a list with no records. It can also show a button that starts the next step.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Title | The main message, for example `No orders yet`. | Text. Default: `No results` |
| Description | A second line under the title that explains what to do next. | Text |
| Icon | Icon shown above the title. | Text. Default: `inbox` |
| Action label | Text on the button under the message. Leave it empty to hide the button. | Text |
| Loading look | What the component shows while it is loading: a spinner or a skeleton placeholder. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On action clicked](../common-settings.md#events) | Triggers when the user clicks the action button. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `title` | The main message, for example `No orders yet`. | `{{components.empty1.title}}` |
| `description` | A second line under the title that explains what to do next. | `{{components.empty1.description}}` |
| `icon` | Icon shown above the title. | `{{components.empty1.icon}}` |
| `actionLabel` | Text on the button under the message. Leave it empty to hide the button. | `{{components.empty1.actionLabel}}` |
| `loadingIndicator` | What the component shows while it is loading: a spinner or a skeleton placeholder. | `{{components.empty1.loadingIndicator}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Background | `transparent` |
| Dashed border color | Theme: Default border |
| Radius | — |
| Icon background | Theme: Surface 3 |
| Icon color | Theme: Placeholder text |
| Title color | Theme: Primary text |
| Description color | Theme: Placeholder text |
