---
id: date-picker
title: Date Picker
---

<div className="badge badge--primary">Ant Design</div>

The **Date Picker** component lets users pick a date from a calendar, such as a due date or a delivery date. It can also pick a week, month, quarter or year, or a date and time.

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
| On change | Triggers when the selected date changes, by the user or an action. |
| On open change | Triggers when the calendar opens or closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Changes the date to the one given as `YYYY-MM-DD` and fires **On change**. Text that isn't a date is ignored; empty text clears the field. | `components.datepicker1.setFieldValue("")` |
| Reset field | Returns the date to the **Value** property's value. | `components.datepicker1.resetFields()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.datepicker1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.datepicker1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.datepicker1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.datepicker1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.datepicker1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.datepicker1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
