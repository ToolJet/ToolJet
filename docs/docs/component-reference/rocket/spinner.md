---
id: spinner
title: Spinner
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Spinner** component shows an animated indicator, with an optional label, to tell the user that something is loading or a task is running.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Variant | Style of the animation: a spinning **Ring**, pulsing **Dots** or moving **Bars**. | Ring, Dots, Bars. Default: Ring |
| Size (sm, default, lg or px) | Size of the indicator: `sm`, `default`, `lg`, or a number of pixels from `8` to `200`. | Text. Default: `default` |
| Label | Text shown with the indicator. Leave empty to show the indicator alone. | Text. Default: `Loading…` |
| Label position | Whether the label sits **Beside** the indicator or **Below** it. | Beside, Below. Default: Beside |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `variant` | Style of the animation: a spinning **Ring**, pulsing **Dots** or moving **Bars**. | `{{components.spinner1.variant}}` |
| `size` | Size of the indicator: `sm`, `default`, `lg`, or a number of pixels from `8` to `200`. | `{{components.spinner1.size}}` |
| `label` | Text shown with the indicator. Leave empty to show the indicator alone. | `{{components.spinner1.label}}` |
| `labelPosition` | Whether the label sits **Beside** the indicator or **Below** it. | `{{components.spinner1.labelPosition}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Spinner color | Theme: Brand primary |
| Ring track color | Theme: Brand primary |
| Label color | Theme: Placeholder text |
| Alignment | `left` |
