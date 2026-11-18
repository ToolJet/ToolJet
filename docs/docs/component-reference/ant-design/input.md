---
id: input
title: Input
---

<div className="badge badge--primary">Ant Design</div>

The **Input** component is a single-line text field for entering values such as a name, an email address or a search term.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Label` |
| Extra | Help text shown under the field. A validation message replaces it while the value is invalid. | Text |
| Tooltip | Text shown when the user hovers over an info icon after the label. | Text |
| Layout | `vertical` puts the label above the field; `horizontal` puts it at the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | Text in the field when the app loads. **Reset field** returns to this value. | Text |
| Placeholder | Hint shown in the field while it is empty. | Text. Default: `Enter your input` |
| Type | Kind of text the field expects. `email` and `url` show an error for text that isn't a valid address; `password` hides the text and adds a button to show it. | `text`, `email`, `password`, `url`, `tel`, `search`. Default: `text` |
| Allow clear | Shows a button in the field that clears the text. | On or off. Default: Off |
| Max length | Most characters the user can type. Leave it at `0` for no limit. | Number. Default: `0` |
| Show count | Shows the number of characters typed, and the limit when **Max length** is set. | On or off. Default: Off |
| Prefix | Text or an icon shown inside the field before the text, such as `SearchOutlined`. | Text |
| Suffix | Text or an icon shown inside the field after the text, such as `MailOutlined`. | Text |
| Addon before | Text shown in a gray box attached to the start of the field, such as `https://`. | Text |
| Addon after | Text shown in a gray box attached to the end of the field, such as `.com`. | Text |
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
| On change | Triggers when the text changes, by typing or an action. |
| On press enter | Triggers when the user presses Enter in the field. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |
| On clear | Triggers when the user clears the field with its clear button. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Changes the text to the given **Value** and fires **On change**. | `components.input1.setFieldValue("")` |
| Reset field | Returns the text to the **Value** property's value. | `components.input1.resetFields()` |
| Focus | Moves keyboard focus to the field. | `components.input1.focus()` |
| Blur | Removes keyboard focus from the field. | `components.input1.blur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.input1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.input1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.input1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.input1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is invalid. | `{{components.input1.extra}}` |
| `tooltip` | Text shown when the user hovers over an info icon after the label. | `{{components.input1.tooltip}}` |
| `layout` | `vertical` puts the label above the field; `horizontal` puts it at the left. | `{{components.input1.layout}}` |
| `value` | Text in the field when the app loads. **Reset field** returns to this value. | `{{components.input1.value}}` |
| `placeholder` | Hint shown in the field while it is empty. | `{{components.input1.placeholder}}` |
| `type` | Kind of text the field expects. `email` and `url` show an error for text that isn't a valid address; `password` hides the text and adds a button to show it. | `{{components.input1.type}}` |
| `allowClear` | Shows a button in the field that clears the text. | `{{components.input1.allowClear}}` |
| `maxLength` | Most characters the user can type. Leave it at `0` for no limit. | `{{components.input1.maxLength}}` |
| `showCount` | Shows the number of characters typed, and the limit when **Max length** is set. | `{{components.input1.showCount}}` |
| `prefix` | Text or an icon shown inside the field before the text, such as `SearchOutlined`. | `{{components.input1.prefix}}` |
| `suffix` | Text or an icon shown inside the field after the text, such as `MailOutlined`. | `{{components.input1.suffix}}` |
| `addonBefore` | Text shown in a gray box attached to the start of the field, such as `https://`. | `{{components.input1.addonBefore}}` |
| `addonAfter` | Text shown in a gray box attached to the end of the field, such as `.com`. | `{{components.input1.addonAfter}}` |
| `variant` | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `{{components.input1.variant}}` |
| `size` | Height and text size of the field. | `{{components.input1.size}}` |
| `isVisible` | Whether the component is visible. | `{{components.input1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.input1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.input1.isDisabled}}` |

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
