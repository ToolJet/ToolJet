---
id: progress
title: Progress
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Progress** component is a horizontal bar that fills to show how far along something is, such as an upload, a task list or a goal.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the bar. | Text |
| Percent | How full the bar is, from `0` to `100`. | Number. Default: `60` |
| Show percent | Shows the percent as a number above the bar, on the right. | On or off. Default: Off |
| Color | Color of the bar: the theme's accent, or green for **success**, amber for **warning** and red for **destructive**. A **Bar color** style overrides it. | `default`, `success`, `warning`, `destructive`. Default: `default` |
| Loading look | What shows while the component is loading: a spinner or a skeleton bar. | Spinner, Skeleton. Default: Spinner |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the bar to the given **Value**, kept between `0` and `100`. | `components.progress1.setValue("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the bar. | `{{components.progress1.label}}` |
| `value` | How full the bar is, from `0` to `100`. | `{{components.progress1.value}}` |
| `showValue` | Shows the percent as a number above the bar, on the right. | `{{components.progress1.showValue}}` |
| `variant` | Color of the bar: the theme's accent, or green for **success**, amber for **warning** and red for **destructive**. A **Bar color** style overrides it. | `{{components.progress1.variant}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or a skeleton bar. | `{{components.progress1.loadingIndicator}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Bar color | Theme: Brand primary |
| Track color | Theme: Brand primary |
| Label color | Theme: Primary text |
| Percent text color | Theme: Placeholder text |
| Bar height | `8` |
| Fill | — |
