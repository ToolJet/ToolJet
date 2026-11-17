---
id: slider
title: Slider
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Slider** component lets the user pick a number, or a range between two numbers, by dragging a handle along a track. Use it for filters such as a price range, a discount or a score threshold.

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
| On change | Triggers when the user releases a handle after moving it. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Moves the slider to the given **Value**. On a range, it sets the start. | `components.slider1.setValue("")` |
| Set range value | Sets a range to the given **Start** and **End** values. | `components.slider1.setRangeValue("", "")` |
| Reset | Moves the slider back to **Default value** without firing **On change**. | `components.slider1.reset()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.slider1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.slider1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.slider1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.slider1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.slider1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.slider1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Range and handle color | Theme: Brand primary |
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Track color | Theme: Brand primary |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
