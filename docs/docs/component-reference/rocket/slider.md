---
id: slider
title: Slider
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Slider** component lets the user pick a number, or a range between two numbers, by dragging a handle along a track. Use it for filters such as a price range, a discount or a score threshold.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the slider. | Text. Default: `Label` |
| Help text | Hint text shown under the slider. | Text |
| Minimum | Lowest value the slider can reach. | Number. Default: `0` |
| Maximum | Highest value the slider can reach. | Number. Default: `100` |
| Step | Amount the value changes by as the handle moves. | Number. Default: `1` |
| Range | Shows two handles so the user picks a start and an end value. | On or off. Default: Off |
| Default value (number, or [start, end] for a range) | Value when the app loads: a number, or `[start, end]` for a range. A range with a single number starts at **Minimum** and **Maximum**. | Number. Default: `50` |
| Show value | Shows the current value next to the label, such as `Label: 50` or `Label: 20 to 80`. | On or off. Default: On |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the user releases a handle after moving it. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Moves the slider to the given **Value**. On a range, it sets the start. | `components.slider1.setValue("")` |
| Set range value | Sets a range to the given **Start** and **End** values. | `components.slider1.setRangeValue("", "")` |
| Reset | Moves the slider back to **Default value** without firing **On change**. | `components.slider1.reset()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the slider. | `{{components.slider1.label}}` |
| `description` | Hint text shown under the slider. | `{{components.slider1.description}}` |
| `min` | Lowest value the slider can reach. | `{{components.slider1.min}}` |
| `max` | Highest value the slider can reach. | `{{components.slider1.max}}` |
| `step` | Amount the value changes by as the handle moves. | `{{components.slider1.step}}` |
| `range` | Shows two handles so the user picks a start and an end value. | `{{components.slider1.range}}` |
| `defaultValue` | Value when the app loads: a number, or `[start, end]` for a range. A range with a single number starts at **Minimum** and **Maximum**. | `{{components.slider1.defaultValue}}` |
| `showValue` | Shows the current value next to the label, such as `Label: 50` or `Label: 20 to 80`. | `{{components.slider1.showValue}}` |
| `value` | The selected number, or `[start, end]` for a range. | `{{components.slider1.value}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Range and handle color | Theme: Brand primary |
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Track color | Theme: Brand primary |
