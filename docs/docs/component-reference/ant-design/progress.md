---
id: progress
title: Progress
---

<div className="badge badge--primary">Ant Design</div>

The **Progress** component is Ant Design's progress indicator. It shows how far a task or goal has come, as a bar or a ring.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Percent | How complete the task is, from 0 to 100. | Number. Default: `60` |
| Type | Shape of the indicator. `line` is a bar, `circle` a full ring and `dashboard` a ring with a gap at the bottom. | `line`, `circle`, `dashboard`. Default: `line` |
| Status | State shown on the indicator. `active` animates the bar, `success` turns it green with a check, and `exception` turns it red with a cross. | `normal`, `active`, `success`, `exception`. Default: `normal` |
| Show info | Shows the percent, or the success or exception icon, next to the bar or inside the ring. | On or off. Default: On |
| Steps | Splits a `line` bar into this many segments. `0` draws a continuous bar. | Number. Default: `0` |
| Stroke color | Color of the filled part. Leave it empty to use the theme's primary color. | Text |
| Title | Caption shown above a `line` bar. | Text |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `percent` | How complete the task is, from 0 to 100. | `{{components.progress1.percent}}` |
| `type` | Shape of the indicator. `line` is a bar, `circle` a full ring and `dashboard` a ring with a gap at the bottom. | `{{components.progress1.type}}` |
| `status` | State shown on the indicator. `active` animates the bar, `success` turns it green with a check, and `exception` turns it red with a cross. | `{{components.progress1.status}}` |
| `showInfo` | Shows the percent, or the success or exception icon, next to the bar or inside the ring. | `{{components.progress1.showInfo}}` |
| `steps` | Splits a `line` bar into this many segments. `0` draws a continuous bar. | `{{components.progress1.steps}}` |
| `strokeColor` | Color of the filled part. Leave it empty to use the theme's primary color. | `{{components.progress1.strokeColor}}` |
| `title` | Caption shown above a `line` bar. | `{{components.progress1.title}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
