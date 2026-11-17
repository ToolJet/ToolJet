---
id: color-picker
title: Color Picker
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Color Picker** component lets the user choose a color from preset swatches, a saturation and hue picker, or by typing a hex code. Use it for settings such as a brand or label color.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Brand color` |
| Help text | Help text shown under the field. | Text |
| Default color | The color the field starts with, as a hex code such as `#6366f1`. Changing it resets the field to this color. | Text. Default: `#6366f1` |
| Placeholder | Text shown in the field when no color is chosen. | Text. Default: `Pick a color` |
| Preset swatches | Preset colors shown in the picker, as a list of hex codes. | Array |
| Show swatches | Shows the preset swatches in the picker. | On or off. Default: On |
| Show saturation and hue picker | Shows the saturation and brightness area and the hue slider in the picker. | On or off. Default: On |
| Allow transparency (alpha) | Adds an opacity slider so the user can choose a semi-transparent color. The hex code then includes the alpha value. | On or off. Default: Off |
| Trigger | How the closed field looks: **Swatch and hex** shows the color and its code, **Swatch only** shows just the color. | Swatch and hex, Swatch only. Default: Swatch and hex |
| Show clear button | Shows a button that clears the chosen color. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the user picks a different color or clears it. |
| [On focus](../common-settings.md#events) | Triggers when the user opens the color picker. |
| [On blur](../common-settings.md#events) | Triggers when the color picker closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set color | Sets the chosen color to **Color**. An empty value clears it. | `components.colorpicker1.setColor("")` |
| Set focus | Moves keyboard focus to the field. | `components.colorpicker1.setFocus()` |
| Set blur | Removes keyboard focus from the field. | `components.colorpicker1.setBlur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.colorpicker1.label}}` |
| `description` | Help text shown under the field. | `{{components.colorpicker1.description}}` |
| `defaultValue` | The color the field starts with, as a hex code such as `#6366f1`. Changing it resets the field to this color. | `{{components.colorpicker1.defaultValue}}` |
| `placeholder` | Text shown in the field when no color is chosen. | `{{components.colorpicker1.placeholder}}` |
| `swatches` | Preset colors shown in the picker, as a list of hex codes. | `{{components.colorpicker1.swatches}}` |
| `showSwatches` | Shows the preset swatches in the picker. | `{{components.colorpicker1.showSwatches}}` |
| `showPicker` | Shows the saturation and brightness area and the hue slider in the picker. | `{{components.colorpicker1.showPicker}}` |
| `allowAlpha` | Adds an opacity slider so the user can choose a semi-transparent color. The hex code then includes the alpha value. | `{{components.colorpicker1.allowAlpha}}` |
| `triggerStyle` | How the closed field looks: **Swatch and hex** shows the color and its code, **Swatch only** shows just the color. | `{{components.colorpicker1.triggerStyle}}` |
| `showClearBtn` | Shows a button that clears the chosen color. | `{{components.colorpicker1.showClearBtn}}` |
| `value` | The chosen color as a hex code, such as `#6366f1`, or empty when no color is chosen. | `{{components.colorpicker1.value}}` |
| `selectedColorRGB` | The chosen color in `rgb()` form. | `{{components.colorpicker1.selectedColorRGB}}` |
| `selectedColorRGBA` | The chosen color in `rgba()` form, including opacity. | `{{components.colorpicker1.selectedColorRGBA}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Field background | Theme: Surface 1 |
| Field text color | Theme: Primary text |
| Placeholder color | Theme: Placeholder text |
| Field border color | Theme: Default border |
| Accent (focus ring) | Theme: Brand primary |
| Field radius | — |
| Popover background | Theme: Surface 1 |
