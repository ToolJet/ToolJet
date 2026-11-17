---
id: spin
title: Spin
---

<div className="badge badge--primary">Ant Design</div>

The **Spin** component is Ant Design's loading spinner. It tells users that something is in progress, such as a query or a file upload.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Spinning | Shows the spinner. Turn it off to hide it, for example with `{{queries.getOrders.isLoading}}`. | On or off. Default: On |
| Tip | Text shown under the spinner, such as `Loading orders`. | Text |
| Size | Size of the spinner. | `small`, `default`, `large`. Default: `default` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `spinning` | Shows the spinner. Turn it off to hide it, for example with `{{queries.getOrders.isLoading}}`. | `{{components.spin1.spinning}}` |
| `tip` | Text shown under the spinner, such as `Loading orders`. | `{{components.spin1.tip}}` |
| `size` | Size of the spinner. | `{{components.spin1.size}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
