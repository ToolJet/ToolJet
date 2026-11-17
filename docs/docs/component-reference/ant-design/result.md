---
id: result
title: Result
---

<div className="badge badge--primary">Ant Design</div>

The **Result** component is Ant Design's result page. It tells users how an action ended, such as a submitted request or a failed payment, or that a page is missing or not allowed.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Status | Kind of result, which sets the icon or illustration. `success`, `info`, `warning` and `error` show an icon; `404`, `403` and `500` show an illustration for not found, no access and a server error. | `success`, `info`, `warning`, `error`, `404`, `403`, `500`. Default: `info` |
| Title | Main message. | Text. Default: `Your request was received` |
| Sub title | Smaller text under the title with details or next steps. | Text. Default: `We will email you when it is ready.` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `status` | Kind of result, which sets the icon or illustration. `success`, `info`, `warning` and `error` show an icon; `404`, `403` and `500` show an illustration for not found, no access and a server error. | `{{components.result1.status}}` |
| `title` | Main message. | `{{components.result1.title}}` |
| `subTitle` | Smaller text under the title with details or next steps. | `{{components.result1.subTitle}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
