---
id: steps
title: Steps
---

<div className="badge badge--primary">Ant Design</div>

The **Steps** component is Ant Design's step indicator. It shows where a process stands, such as an order's delivery or the stages of a form wizard.

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
| On change | Triggers when the current step changes, from a click or an action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Next | Moves to the next step. Nothing happens on the last step. | `components.steps1.next()` |
| Previous | Moves to the previous step. Nothing happens on the first step. | `components.steps1.prev()` |
| Set current | Makes the step at the given **Step index**, counting from 0, the current one. | `components.steps1.setCurrent("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.steps1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.steps1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.steps1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.steps1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.steps1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.steps1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
