---
id: progress
title: Progress
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Progress** component is a horizontal bar that fills to show how far along something is, such as an upload, a task list or a goal.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the bar. | Text |
| Percent | How full the bar is, from `0` to `100`. | Number. Default: `60` |
| Show percent | Shows the percent as a number above the bar, on the right. | On or off. Default: Off |
| Color | Color of the bar: the theme's accent, or green for **success**, amber for **warning** and red for **destructive**. A **Bar color** style overrides it. | `default`, `success`, `warning`, `destructive`. Default: `default` |
| Loading look | What shows while the component is loading: a spinner or a skeleton bar. | Spinner, Skeleton. Default: Spinner |

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

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the bar to the given **Value**, kept between `0` and `100`. | `components.progress1.setValue("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.progress1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.progress1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.progress1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the bar. | `{{components.progress1.label}}` |
| `value` | How full the bar is, from `0` to `100`. | `{{components.progress1.value}}` |
| `showValue` | Shows the percent as a number above the bar, on the right. | `{{components.progress1.showValue}}` |
| `variant` | Color of the bar: the theme's accent, or green for **success**, amber for **warning** and red for **destructive**. A **Bar color** style overrides it. | `{{components.progress1.variant}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or a skeleton bar. | `{{components.progress1.loadingIndicator}}` |
| `isVisible` | Whether the component is visible. | `{{components.progress1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.progress1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.progress1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Bar color | Theme: Brand primary |
| Track color | Theme: Brand primary |
| Label color | Theme: Primary text |
| Percent text color | Theme: Placeholder text |
| Bar height | `8` |
| Fill | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
