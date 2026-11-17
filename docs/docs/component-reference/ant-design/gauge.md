---
id: gauge
title: Gauge
---

<div className="badge badge--primary">Ant Design</div>

The **Gauge** component shows one value on a dial against a scale, such as progress toward a target or a utilization score.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Target | The value the needle points to. The needle stops at the ends of the scale, but the number in the middle shows the real value. | Number. Default: `72` |
| Total | The value at the end of the scale. | Number. Default: `100` |
| Name | A name for the value the gauge shows. | Text |
| Thresholds | Where the color bands end, such as `[40, 70, 100]` for red, amber and green bands. Leave it empty for a single band in the theme color. | Array |
| Formatter | How the number in the middle is written. `percent` shows **Target** as a share of **Total**; `compact` shortens large numbers, such as `1.2K`. | `auto`, `number`, `currency`, `percent`, `compact`. Default: `auto` |
| Currency | Currency code, such as `USD` or `EUR`, used when **Formatter** is `currency`. | Text. Default: `USD` |
| Locale | Locale for number and currency formats, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Title | Heading shown above the gauge. | Text |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `target` | The value the needle points to. The needle stops at the ends of the scale, but the number in the middle shows the real value. | `{{components.gauge1.target}}` |
| `total` | The value at the end of the scale. | `{{components.gauge1.total}}` |
| `name` | A name for the value the gauge shows. | `{{components.gauge1.name}}` |
| `thresholds` | Where the color bands end, such as `[40, 70, 100]` for red, amber and green bands. Leave it empty for a single band in the theme color. | `{{components.gauge1.thresholds}}` |
| `formatter` | How the number in the middle is written. `percent` shows **Target** as a share of **Total**; `compact` shortens large numbers, such as `1.2K`. | `{{components.gauge1.formatter}}` |
| `currency` | Currency code, such as `USD` or `EUR`, used when **Formatter** is `currency`. | `{{components.gauge1.currency}}` |
| `locale` | Locale for number and currency formats, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.gauge1.locale}}` |
| `title` | Heading shown above the gauge. | `{{components.gauge1.title}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
