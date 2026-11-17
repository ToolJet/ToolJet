---
id: empty
title: Empty
---

<div className="badge badge--primary">Ant Design</div>

The **Empty** component shows a placeholder picture and message for a place with no data yet, such as an empty search result or a list with no records.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Description | Message shown under the picture. Leave it empty to show only the picture. | Text. Default: `No data` |
| Image | `default` is a larger illustration; `simple` is a small, plain outline. | `default`, `simple`. Default: `simple` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `description` | Message shown under the picture. Leave it empty to show only the picture. | `{{components.empty1.description}}` |
| `image` | `default` is a larger illustration; `simple` is a small, plain outline. | `{{components.empty1.image}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
