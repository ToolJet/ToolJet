---
id: steps
title: Steps
---

<div className="badge badge--primary">Ant Design</div>

The **Steps** component is Ant Design's step indicator. It shows where a process stands, such as an order's delivery or the stages of a form wizard.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The steps, each with a `title` and an optional `description`, such as `[{ title: 'Packed', description: 'Sep 15' }]`. | Array |
| Current | Position of the current step, counting from 0. Steps before it show as done. | Number. Default: `0` |
| Direction | Lays the steps out in a row or a column. | `horizontal`, `vertical`. Default: `horizontal` |
| Size | Size of the step icons and text. | `default`, `small`. Default: `default` |
| Type | Look of the steps. `navigation` shows them as a navigation bar, and `inline` as a compact row of small dots. | `default`, `navigation`, `inline`. Default: `default` |
| Status | State of the current step: `process` for in progress, `wait` for not started, `finish` for done and `error` for failed. | `process`, `wait`, `finish`, `error`. Default: `process` |
| Progress dot | Shows small dots instead of numbered circles. | On or off. Default: Off |
| Clickable | Lets the user click a step to make it the current one. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the current step changes, from a click or an action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Next | Moves to the next step. Nothing happens on the last step. | `components.steps1.next()` |
| Previous | Moves to the previous step. Nothing happens on the first step. | `components.steps1.prev()` |
| Set current | Makes the step at the given **Step index**, counting from 0, the current one. | `components.steps1.setCurrent("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The steps, each with a `title` and an optional `description`, such as `[{ title: 'Packed', description: 'Sep 15' }]`. | `{{components.steps1.items}}` |
| `current` | Position of the current step, counting from 0. Steps before it show as done. | `{{components.steps1.current}}` |
| `direction` | Lays the steps out in a row or a column. | `{{components.steps1.direction}}` |
| `size` | Size of the step icons and text. | `{{components.steps1.size}}` |
| `type` | Look of the steps. `navigation` shows them as a navigation bar, and `inline` as a compact row of small dots. | `{{components.steps1.type}}` |
| `status` | State of the current step: `process` for in progress, `wait` for not started, `finish` for done and `error` for failed. | `{{components.steps1.status}}` |
| `progressDot` | Shows small dots instead of numbered circles. | `{{components.steps1.progressDot}}` |
| `clickable` | Lets the user click a step to make it the current one. | `{{components.steps1.clickable}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
