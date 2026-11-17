---
id: rating
title: Rating
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Rating** component lets the user give a score by clicking a row of icons, such as stars for a review, a satisfaction score or a priority level. It can also display a rating without letting the user change it.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the icons. | Text. Default: `Rating` |
| Help text | Hint text shown under the icons. | Text |
| Default value | Rating shown when the app loads. | Number. Default: `4` |
| Number of icons (1 to 10) | Number of icons in the row, from `1` to `10`. This is the highest possible rating. | Number. Default: `5` |
| Icon | Shape of the icons. | Star, Heart, Circle. Default: Star |
| Size | Size of the icons. | Small, Medium, Large. Default: Medium |
| Allow half values | Lets the user pick half values, such as `3.5`, by clicking the left half of an icon. | On or off. Default: Off |
| Click the current value to clear | Clears the rating to `0` when the user clicks the icon of the current rating again. | On or off. Default: On |
| Read only | Shows the rating without letting the user change it. | On or off. Default: Off |
| Show value text | Shows the rating as text next to the icons, such as `4 / 5`, or the matching entry from **Value labels**. | On or off. Default: Off |
| Value labels (one per icon) | A word for each rating, one per icon, such as `['Poor', 'Fair', 'Good', 'Great', 'Excellent']`. Shown as the value text and read out by screen readers. | Array |

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
| On change | Triggers when the user changes the rating. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the rating to the given **Value**. | `components.rating1.setValue("")` |
| Clear | Clears the rating to `0`. | `components.rating1.clear()` |
| Reset value | Sets the rating back to **Default value**. | `components.rating1.resetValue()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.rating1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.rating1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.rating1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the icons. | `{{components.rating1.label}}` |
| `description` | Hint text shown under the icons. | `{{components.rating1.description}}` |
| `defaultValue` | Rating shown when the app loads. | `{{components.rating1.defaultValue}}` |
| `max` | Number of icons in the row, from `1` to `10`. This is the highest possible rating. | `{{components.rating1.max}}` |
| `icon` | Shape of the icons. | `{{components.rating1.icon}}` |
| `size` | Size of the icons. | `{{components.rating1.size}}` |
| `allowHalf` | Lets the user pick half values, such as `3.5`, by clicking the left half of an icon. | `{{components.rating1.allowHalf}}` |
| `allowClear` | Clears the rating to `0` when the user clicks the icon of the current rating again. | `{{components.rating1.allowClear}}` |
| `readOnly` | Shows the rating without letting the user change it. | `{{components.rating1.readOnly}}` |
| `showValue` | Shows the rating as text next to the icons, such as `4 / 5`, or the matching entry from **Value labels**. | `{{components.rating1.showValue}}` |
| `valueLabels` | A word for each rating, one per icon, such as `['Poor', 'Fair', 'Good', 'Great', 'Excellent']`. Shown as the value text and read out by screen readers. | `{{components.rating1.valueLabels}}` |
| `value` | The current rating, or `0` when there is none. | `{{components.rating1.value}}` |
| `isVisible` | Whether the component is visible. | `{{components.rating1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.rating1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.rating1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Filled icon color | `#f59e0b` |
| Empty icon color | Theme: Placeholder text |
| Value text color | Theme: Placeholder text |
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Focus ring color | Theme: Brand primary |
| Error color | Theme: Error |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
