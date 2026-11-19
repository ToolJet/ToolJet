---
id: key-value
title: Key Value
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Key Value** component shows a record as a list of labels and values, such as a customer's details or an order summary. Rows can be typed so that amounts, dates, statuses, links and yes/no values are formatted for reading.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data (object or array) | The details to show: an object, or a list of rows like `{ label, value, type }`. A row's `type` can be `text`, `number`, `currency`, `date`, `datetime`, `badge`, `link` or `boolean`. | Object |
| Columns | How many columns the rows are spread across. Fewer columns are used when the component is too narrow to fit them. | `1`, `2`, `3`, `4`. Default: `1` |
| Layout | Where each label sits. **inline** puts the label beside the value; **stacked** puts it above. | `stacked`, `inline`. Default: `inline` |
| Label width (side by side; px or %) | Width of the label beside its value when **Layout** is **inline**, in pixels or a percentage such as `40%`. | Text. Default: `40%` |
| Dividers | Draws a line between rows. | On or off. Default: On |
| Empty value text | Text shown in place of an empty value. | Text. Default: `—` |
| Currency (currency rows) | Currency code used for `currency` rows, such as `USD` or `EUR`. | Text. Default: `USD` |
| Number locale | Locale used to format numbers and amounts, such as `en-US` or `de-DE`. | Text. Default: `en-US` |
| Date format (date rows) | Format for `date` rows, such as `DD MMM YYYY`. | Text. Default: `DD MMM YYYY` |
| Badge colours by value | Colors for `badge` rows by value, for example `{ Active: '#16a34a' }`. | Object. Default: `{"Active": "#16a34a"}` |
| Copy button on hover | Shows a button next to each value that copies it to the clipboard. | On or off. Default: Off |
| Loading look | What shows while the component is loading: a **Spinner** or a **Skeleton** outline of the rows. | Spinner, Skeleton. Default: Spinner |

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
| On field click | Triggers when the user clicks a row, or presses Enter or Space on it. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.keyvalue1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.keyvalue1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.keyvalue1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The details to show: an object, or a list of rows like `{ label, value, type }`. A row's `type` can be `text`, `number`, `currency`, `date`, `datetime`, `badge`, `link` or `boolean`. | `{{components.keyvalue1.data}}` |
| `columns` | How many columns the rows are spread across. Fewer columns are used when the component is too narrow to fit them. | `{{components.keyvalue1.columns}}` |
| `layout` | Where each label sits. **inline** puts the label beside the value; **stacked** puts it above. | `{{components.keyvalue1.layout}}` |
| `labelWidth` | Width of the label beside its value when **Layout** is **inline**, in pixels or a percentage such as `40%`. | `{{components.keyvalue1.labelWidth}}` |
| `dividers` | Draws a line between rows. | `{{components.keyvalue1.dividers}}` |
| `emptyText` | Text shown in place of an empty value. | `{{components.keyvalue1.emptyText}}` |
| `currency` | Currency code used for `currency` rows, such as `USD` or `EUR`. | `{{components.keyvalue1.currency}}` |
| `locale` | Locale used to format numbers and amounts, such as `en-US` or `de-DE`. | `{{components.keyvalue1.locale}}` |
| `dateFormat` | Format for `date` rows, such as `DD MMM YYYY`. | `{{components.keyvalue1.dateFormat}}` |
| `badgeColors` | Colors for `badge` rows by value, for example `{ Active: '#16a34a' }`. | `{{components.keyvalue1.badgeColors}}` |
| `allowCopy` | Shows a button next to each value that copies it to the clipboard. | `{{components.keyvalue1.allowCopy}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a **Skeleton** outline of the rows. | `{{components.keyvalue1.loadingIndicator}}` |
| `lastClickedField` | The `label` and `value` of the row the user clicked last. | `{{components.keyvalue1.lastClickedField}}` |
| `isVisible` | Whether the component is visible. | `{{components.keyvalue1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.keyvalue1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.keyvalue1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Label color | Theme: Placeholder text |
| Value color | Theme: Primary text |
| Divider color | Theme: Default border |
| Link color | Theme: Brand primary |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
