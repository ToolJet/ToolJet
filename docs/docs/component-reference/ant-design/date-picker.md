---
id: date-picker
title: Date Picker
---

<div className="badge badge--primary">Ant Design</div>

The **Date Picker** component lets users pick a date from a calendar, such as a due date or a delivery date. It can also pick a week, month, quarter or year, or a date and time.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Date` |
| Extra | Help text shown under the field. A validation message replaces it while the value is invalid. | Text |
| Tooltip | Text shown when the user hovers over an info icon after the label. | Text |
| Layout | `vertical` puts the label above the field; `horizontal` puts it at the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | Date selected when the app loads, as `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm:ss` when **Show time** is on. **Reset field** returns to this value. | Text |
| Show time | Adds hour and minute columns, so the user picks a date and a time. | On or off. Default: Off |
| Format | How the date is written in the field, such as `DD MMM YYYY`. It doesn't change the value's format. Leave it empty for `YYYY-MM-DD`. | Text |
| Picker | What the user picks. For `week`, `month`, `quarter` and `year`, the value is the first day of the period picked. | `date`, `week`, `month`, `quarter`, `year`. Default: `date` |
| Min date | Earliest date the user can pick, as `YYYY-MM-DD`. An earlier value shows a validation error. | Text |
| Max date | Latest date the user can pick, as `YYYY-MM-DD`. A later value shows a validation error. | Text |
| Placeholder | Hint shown in the field while it is empty. | Text. Default: `Pick a date` |
| Allow clear | Shows a button in the field that clears the date. | On or off. Default: On |
| Variant | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
| Size | Height and text size of the field. | `small`, `middle`, `large`. Default: `middle` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the selected date changes, by the user or an action. |
| [On open change](../common-settings.md#events) | Triggers when the calendar opens or closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Changes the date to the one given as `YYYY-MM-DD` and fires **On change**. Text that isn't a date is ignored; empty text clears the field. | `components.datepicker1.setFieldValue("")` |
| Reset field | Returns the date to the **Value** property's value. | `components.datepicker1.resetFields()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.datepicker1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is invalid. | `{{components.datepicker1.extra}}` |
| `tooltip` | Text shown when the user hovers over an info icon after the label. | `{{components.datepicker1.tooltip}}` |
| `layout` | `vertical` puts the label above the field; `horizontal` puts it at the left. | `{{components.datepicker1.layout}}` |
| `value` | Date selected when the app loads, as `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm:ss` when **Show time** is on. **Reset field** returns to this value. | `{{components.datepicker1.value}}` |
| `showTime` | Adds hour and minute columns, so the user picks a date and a time. | `{{components.datepicker1.showTime}}` |
| `format` | How the date is written in the field, such as `DD MMM YYYY`. It doesn't change the value's format. Leave it empty for `YYYY-MM-DD`. | `{{components.datepicker1.format}}` |
| `picker` | What the user picks. For `week`, `month`, `quarter` and `year`, the value is the first day of the period picked. | `{{components.datepicker1.picker}}` |
| `minDate` | Earliest date the user can pick, as `YYYY-MM-DD`. An earlier value shows a validation error. | `{{components.datepicker1.minDate}}` |
| `maxDate` | Latest date the user can pick, as `YYYY-MM-DD`. A later value shows a validation error. | `{{components.datepicker1.maxDate}}` |
| `placeholder` | Hint shown in the field while it is empty. | `{{components.datepicker1.placeholder}}` |
| `allowClear` | Shows a button in the field that clears the date. | `{{components.datepicker1.allowClear}}` |
| `variant` | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `{{components.datepicker1.variant}}` |
| `size` | Height and text size of the field. | `{{components.datepicker1.size}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
