---
id: date-time-picker
title: Date Time Picker
---

<div className="badge badge--primary">Ant Design</div>

The **Date Time Picker** component lets users pick a date and a time together, such as when to schedule a meeting or a delivery slot.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Date and time` |
| Extra | Help text shown under the field. A validation message replaces it while the value is invalid. | Text |
| Tooltip | Text shown when the user hovers over an info icon after the label. | Text |
| Layout | `vertical` puts the label above the field; `horizontal` puts it at the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | Date and time selected when the app loads, as `YYYY-MM-DDTHH:mm:ss` in local time. **Reset field** returns to this value. | Text |
| Format | How the date and time are written in the field, such as `DD MMM YYYY HH:mm`. It doesn't change the value's format. Leave it empty for `YYYY-MM-DD` and the time. | Text |
| Use 12 hours | Shows the time with AM and PM instead of the 24-hour clock. | On or off. Default: Off |
| Minute step | Gap between the minutes the user can pick, from 1 to 30, such as `15` for quarter hours. | Number. Default: `5` |
| Min date | Earliest date and time the user can pick, as `YYYY-MM-DDTHH:mm:ss`, or a date alone for the start of that day. An earlier value shows a validation error. | Text |
| Max date | Latest date and time the user can pick, as `YYYY-MM-DDTHH:mm:ss`, or a date alone for the end of that day. A later value shows a validation error. | Text |
| Placeholder | Hint shown in the field while it is empty. | Text. Default: `Pick a date and time` |
| Allow clear | Shows a button in the field that clears the date and time. | On or off. Default: On |
| Variant | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
| Size | Height and text size of the field. | `small`, `middle`, `large`. Default: `middle` |

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
| On change | Triggers when the selected date or time changes, by the user or an action. |
| On open change | Triggers when the picker opens or closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Changes the date and time to the one given as `YYYY-MM-DDTHH:mm:ss` and fires **On change**. Text that isn't a date is ignored; empty text clears the field. | `components.datetimepicker1.setFieldValue("")` |
| Reset field | Returns the date and time to the **Value** property's value. | `components.datetimepicker1.resetFields()` |
| Clear | Empties the field and fires **On change**. | `components.datetimepicker1.clear()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.datetimepicker1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.datetimepicker1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.datetimepicker1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.datetimepicker1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is invalid. | `{{components.datetimepicker1.extra}}` |
| `tooltip` | Text shown when the user hovers over an info icon after the label. | `{{components.datetimepicker1.tooltip}}` |
| `layout` | `vertical` puts the label above the field; `horizontal` puts it at the left. | `{{components.datetimepicker1.layout}}` |
| `value` | Date and time selected when the app loads, as `YYYY-MM-DDTHH:mm:ss` in local time. **Reset field** returns to this value. | `{{components.datetimepicker1.value}}` |
| `format` | How the date and time are written in the field, such as `DD MMM YYYY HH:mm`. It doesn't change the value's format. Leave it empty for `YYYY-MM-DD` and the time. | `{{components.datetimepicker1.format}}` |
| `use12Hours` | Shows the time with AM and PM instead of the 24-hour clock. | `{{components.datetimepicker1.use12Hours}}` |
| `minuteStep` | Gap between the minutes the user can pick, from 1 to 30, such as `15` for quarter hours. | `{{components.datetimepicker1.minuteStep}}` |
| `minDate` | Earliest date and time the user can pick, as `YYYY-MM-DDTHH:mm:ss`, or a date alone for the start of that day. An earlier value shows a validation error. | `{{components.datetimepicker1.minDate}}` |
| `maxDate` | Latest date and time the user can pick, as `YYYY-MM-DDTHH:mm:ss`, or a date alone for the end of that day. A later value shows a validation error. | `{{components.datetimepicker1.maxDate}}` |
| `placeholder` | Hint shown in the field while it is empty. | `{{components.datetimepicker1.placeholder}}` |
| `allowClear` | Shows a button in the field that clears the date and time. | `{{components.datetimepicker1.allowClear}}` |
| `variant` | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `{{components.datetimepicker1.variant}}` |
| `size` | Height and text size of the field. | `{{components.datetimepicker1.size}}` |
| `selectedDate` | The date part of the value, as `YYYY-MM-DD`. | `{{components.datetimepicker1.selectedDate}}` |
| `selectedTime` | The time part of the value, as `HH:mm` on the 24-hour clock. | `{{components.datetimepicker1.selectedTime}}` |
| `unixTimestamp` | The selected date and time as a Unix timestamp in milliseconds. | `{{components.datetimepicker1.unixTimestamp}}` |
| `isVisible` | Whether the component is visible. | `{{components.datetimepicker1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.datetimepicker1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.datetimepicker1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
