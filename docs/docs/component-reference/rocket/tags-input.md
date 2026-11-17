---
id: tags-input
title: Tags Input
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Tags Input** component lets the user build a list of short tags by typing them or picking from suggestions, such as labels on a ticket, skills on a profile or email recipients. Each tag shows as a removable chip.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Tags` |
| Help text | Hint text shown under the field. | Text |
| Placeholder | Text shown in the field when it is empty. | Text. Default: `Add a tag...` |
| Default tags | Tags in the field when the app loads. | Array |
| Suggestions | Tags offered in a dropdown as the user types, as plain values or as items with a `label` and a `value`. | Array |
| Allow tags not in suggestions | Lets the user add tags that aren't in **Suggestions**. When off, only suggested tags can be added. | On or off. Default: On |
| Max tags (0 for no limit) | Most tags the field takes. Once reached, the user can't add more. `0` means no limit. | Number. Default: `0` |
| Case-sensitive duplicate check | Treats tags that differ only in uppercase and lowercase, such as `Urgent` and `urgent`, as different tags. | On or off. Default: Off |
| Tag pattern (regex) | A regular expression each new tag must match, such as `^[a-z0-9-]+$`. Tags that don't match are refused with an error. | Text |
| Pattern error message | Message shown when a tag doesn't match **Tag pattern (regex)**. | Text |
| Add typed text on blur | Adds the text still being typed as a tag when the field loses focus. | On or off. Default: Off |
| Show clear button | Shows a button in the field that removes all the tags. | On or off. Default: Off |

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
| On change | Triggers when the user adds or removes a tag. |
| On tag added | Triggers when the user adds a tag. |
| On tag deleted | Triggers when the user removes a tag. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set tags | Replaces all the tags with the given **Tags**. | `components.tagsinput1.setTags("")` |
| Select tags | Adds the given **Tags** to the ones already in the field. | `components.tagsinput1.selectTags("")` |
| Deselect tags | Removes the given **Tags** from the field. | `components.tagsinput1.deselectTags("")` |
| Clear | Removes all the tags and any text being typed. | `components.tagsinput1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.tagsinput1.setFocus()` |
| Set blur | Removes focus from the field. | `components.tagsinput1.setBlur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.tagsinput1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.tagsinput1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.tagsinput1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.tagsinput1.label}}` |
| `description` | Hint text shown under the field. | `{{components.tagsinput1.description}}` |
| `placeholder` | Text shown in the field when it is empty. | `{{components.tagsinput1.placeholder}}` |
| `defaultValue` | Tags in the field when the app loads. | `{{components.tagsinput1.defaultValue}}` |
| `suggestions` | Tags offered in a dropdown as the user types, as plain values or as items with a `label` and a `value`. | `{{components.tagsinput1.suggestions}}` |
| `allowCustomTags` | Lets the user add tags that aren't in **Suggestions**. When off, only suggested tags can be added. | `{{components.tagsinput1.allowCustomTags}}` |
| `maxTags` | Most tags the field takes. Once reached, the user can't add more. `0` means no limit. | `{{components.tagsinput1.maxTags}}` |
| `caseSensitive` | Treats tags that differ only in uppercase and lowercase, such as `Urgent` and `urgent`, as different tags. | `{{components.tagsinput1.caseSensitive}}` |
| `tagPattern` | A regular expression each new tag must match, such as `^[a-z0-9-]+$`. Tags that don't match are refused with an error. | `{{components.tagsinput1.tagPattern}}` |
| `patternError` | Message shown when a tag doesn't match **Tag pattern (regex)**. | `{{components.tagsinput1.patternError}}` |
| `addOnBlur` | Adds the text still being typed as a tag when the field loses focus. | `{{components.tagsinput1.addOnBlur}}` |
| `showClearBtn` | Shows a button in the field that removes all the tags. | `{{components.tagsinput1.showClearBtn}}` |
| `values` | The tags in the field. | `{{components.tagsinput1.values}}` |
| `newTagsAdded` | The tags in the field that aren't in **Suggestions**. | `{{components.tagsinput1.newTagsAdded}}` |
| `lastAddedTag` | The tag the user added last. | `{{components.tagsinput1.lastAddedTag}}` |
| `lastRemovedTag` | The tag the user removed last. | `{{components.tagsinput1.lastRemovedTag}}` |
| `isVisible` | Whether the component is visible. | `{{components.tagsinput1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.tagsinput1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.tagsinput1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Field background | Theme: Surface 1 |
| Field text color | Theme: Primary text |
| Placeholder color | Theme: Placeholder text |
| Field border color | Theme: Default border |
| Accent (focus ring, checks) | Theme: Brand primary |
| Error color (message and border) | Theme: Error |
| Field radius | — |
| Chip background | Theme: Surface 3 |
| Chip text color | Theme: Primary text |
| Menu background | Theme: Surface 1 |
| Menu text color | Theme: Primary text |
| Highlighted option background | Theme: Surface 3 |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
