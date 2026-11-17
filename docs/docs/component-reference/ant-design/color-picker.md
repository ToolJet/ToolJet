---
id: color-picker
title: Color Picker
---

<div className="badge badge--primary">Ant Design</div>

The **Color Picker** component lets users pick a color from a palette or by its code, such as a label color or a brand color.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Color` |
| Extra | Help text shown under the field. A validation message replaces it while the value is invalid. | Text |
| Tooltip | Text shown when the user hovers over an info icon after the label. | Text |
| Layout | `vertical` puts the label above the field; `horizontal` puts it at the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | Color selected when the app loads, such as `#1677ff` or `rgb(22, 119, 255)`. Text that isn't a color is cleared. **Reset field** returns to this value. | Text |
| Format | How the selected color is written: `hex`, such as `#1677ff`, or `rgb`, such as `rgb(22, 119, 255)`. | `hex`, `rgb`. Default: `hex` |
| Show text | Shows the color's code next to the swatch. | On or off. Default: On |
| Allow clear | Lets the user clear the color from the picker. | On or off. Default: Off |
| Disable alpha | Hides the transparency slider, so the user picks only solid colors. | On or off. Default: On |
| Presets | Groups of ready-made colors shown under the picker, as a list of `{label, colors}`, such as `[{ label: 'Brand', colors: ['#1677ff'] }]`. | Array |
| Size | Size of the color swatch. | `small`, `middle`, `large`. Default: `middle` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the color changes, including while the user drags in the picker. |
| [On change complete](../common-settings.md#events) | Triggers when the user finishes picking a color, such as when they release the pointer. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Changes the color to the given **Value** and fires **On change**. Text that isn't a color is ignored. | `components.colorpicker1.setFieldValue("")` |
| Reset field | Returns the color to the **Value** property's value. | `components.colorpicker1.resetFields()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.colorpicker1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is invalid. | `{{components.colorpicker1.extra}}` |
| `tooltip` | Text shown when the user hovers over an info icon after the label. | `{{components.colorpicker1.tooltip}}` |
| `layout` | `vertical` puts the label above the field; `horizontal` puts it at the left. | `{{components.colorpicker1.layout}}` |
| `value` | Color selected when the app loads, such as `#1677ff` or `rgb(22, 119, 255)`. Text that isn't a color is cleared. **Reset field** returns to this value. | `{{components.colorpicker1.value}}` |
| `format` | How the selected color is written: `hex`, such as `#1677ff`, or `rgb`, such as `rgb(22, 119, 255)`. | `{{components.colorpicker1.format}}` |
| `showText` | Shows the color's code next to the swatch. | `{{components.colorpicker1.showText}}` |
| `allowClear` | Lets the user clear the color from the picker. | `{{components.colorpicker1.allowClear}}` |
| `disabledAlpha` | Hides the transparency slider, so the user picks only solid colors. | `{{components.colorpicker1.disabledAlpha}}` |
| `presets` | Groups of ready-made colors shown under the picker, as a list of `{label, colors}`, such as `[{ label: 'Brand', colors: ['#1677ff'] }]`. | `{{components.colorpicker1.presets}}` |
| `size` | Size of the color swatch. | `{{components.colorpicker1.size}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
