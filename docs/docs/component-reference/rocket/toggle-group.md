---
id: toggle-group
title: Toggle Group
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Toggle Group** component is a row of buttons where the user picks one option, or several, such as a filter for `All`, `Open` and `Closed` or a switch between views.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Options | Options to show as buttons, as plain values or as items with a `label` and a `value` that can add `disabled`. | Array. Default: `["All", "Open", "Closed"]` |
| Default value | Value of the option selected when the app loads. | Text. Default: `All` |
| Full width | Stretches the buttons to fill the component's width. | On or off. Default: Off |
| Alignment | Where the buttons sit when the component is wider than they are. | Left, Center, Right. Default: Left |
| Look | Look of the buttons. **Segmented** puts them in a shaded bar, **Outline** gives each a border, and **Plain** shows them without either. | Segmented, Outline, Plain. Default: Segmented |
| Allow multiple | Lets the user select several options at once. | On or off. Default: Off |
| Default values | Values of the options selected when the app loads, with **Allow multiple** on. It also updates as the selection changes. | Array |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the selection changes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set selected | Selects the option with the given value. With **Allow multiple** on, a list replaces the whole selection. | `components.togglegroup1.setSelected("")` |
| Clear | Clears the selection. | `components.togglegroup1.clear()` |
| Select option (value) | Selects the option with the given value. With **Allow multiple** on, a list replaces the whole selection. | `components.togglegroup1.setValue("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `options` | Options to show as buttons, as plain values or as items with a `label` and a `value` that can add `disabled`. | `{{components.togglegroup1.options}}` |
| `defaultValue` | Value of the option selected when the app loads. | `{{components.togglegroup1.defaultValue}}` |
| `fullWidth` | Stretches the buttons to fill the component's width. | `{{components.togglegroup1.fullWidth}}` |
| `alignment` | Where the buttons sit when the component is wider than they are. | `{{components.togglegroup1.alignment}}` |
| `variant` | Look of the buttons. **Segmented** puts them in a shaded bar, **Outline** gives each a border, and **Plain** shows them without either. | `{{components.togglegroup1.variant}}` |
| `multiple` | Lets the user select several options at once. | `{{components.togglegroup1.multiple}}` |
| `values` | Values of the options selected when the app loads, with **Allow multiple** on. It also updates as the selection changes. | `{{components.togglegroup1.values}}` |
| `value` | The value of the selected option. With **Allow multiple** on, the first selected value. | `{{components.togglegroup1.value}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Group background | Theme: Surface 3 |
| Option text color | Theme: Placeholder text |
| Selected option background | Theme: Surface 1 |
| Selected option text color | Theme: Primary text |
| Group radius | — |
| Border color (outline look) | Theme: Default border |
| Selected (earlier name) | — |
