---
id: range-picker
title: Range Picker
---

<div className="badge badge--primary">Ant Design</div>

The **Range Picker** component is Ant Design's date range input. Users pick a start and an end date in one field, for example to filter a report by period.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Date range` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | The starting range as two `YYYY-MM-DD` dates, such as `['2026-01-01', '2026-01-31']`. A start after the end is not valid. | Array |
| Format | How the dates are shown in the field, such as `DD/MM/YYYY`. **Value** stays in `YYYY-MM-DD` form. | Text. Default: `YYYY-MM-DD` |
| Picker | What the user picks: a `date`, or a whole `week`, `month`, `quarter` or `year`. | `date`, `week`, `month`, `quarter`, `year`. Default: `date` |
| Min date | Earliest date the user can pick, as `YYYY-MM-DD`. | Text |
| Max date | Latest date the user can pick, as `YYYY-MM-DD`. | Text |
| Allow clear | Shows a clear icon in the field once a range is picked. | On or off. Default: On |
| Variant | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
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
| On change | Triggers when the picked range changes, including when it's cleared. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Sets the range to the given **Value**, a pair of `YYYY-MM-DD` dates. | `components.rangepicker1.setFieldValue("")` |
| Reset field | Sets the field back to the **Value** property. | `components.rangepicker1.resetFields()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.rangepicker1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.rangepicker1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.rangepicker1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.rangepicker1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.rangepicker1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.rangepicker1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.rangepicker1.layout}}` |
| `value` | The starting range as two `YYYY-MM-DD` dates, such as `['2026-01-01', '2026-01-31']`. A start after the end is not valid. | `{{components.rangepicker1.value}}` |
| `format` | How the dates are shown in the field, such as `DD/MM/YYYY`. **Value** stays in `YYYY-MM-DD` form. | `{{components.rangepicker1.format}}` |
| `picker` | What the user picks: a `date`, or a whole `week`, `month`, `quarter` or `year`. | `{{components.rangepicker1.picker}}` |
| `minDate` | Earliest date the user can pick, as `YYYY-MM-DD`. | `{{components.rangepicker1.minDate}}` |
| `maxDate` | Latest date the user can pick, as `YYYY-MM-DD`. | `{{components.rangepicker1.maxDate}}` |
| `allowClear` | Shows a clear icon in the field once a range is picked. | `{{components.rangepicker1.allowClear}}` |
| `variant` | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `{{components.rangepicker1.variant}}` |
| `size` | Height and text size of the field. | `{{components.rangepicker1.size}}` |
| `startDate` | Start of the range as `YYYY-MM-DD`, or empty. | `{{components.rangepicker1.startDate}}` |
| `endDate` | End of the range as `YYYY-MM-DD`, or empty. | `{{components.rangepicker1.endDate}}` |
| `isVisible` | Whether the component is visible. | `{{components.rangepicker1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.rangepicker1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.rangepicker1.isDisabled}}` |

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
