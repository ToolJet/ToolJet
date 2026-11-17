---
id: dropdown-menu
title: Dropdown Menu
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Dropdown Menu** component is a button that opens a list of actions, such as **Edit**, **Duplicate** or **Delete**. Use it to group row or record actions without crowding the page.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text on the button. With an icon trigger, it becomes the button's tooltip. | Text. Default: `Actions` |
| Trigger | **Button** shows a labeled button; **Icon** shows a square icon-only button. | Button, Icon. Default: Button |
| Variant | Look of the button. **Destructive** is red; **Link** looks like a text link. | Default, Secondary, Outline, Ghost, Destructive, Link. Default: Outline |
| Size | Height and text size of the button. | Sm, Default, Lg. Default: Default |
| Trigger icon (Tabler name, e.g. IconDots) | Icon shown on the button. With an icon trigger and no icon set, a three-dot icon is shown. | Text |
| Show chevron | Shows a down arrow after the label. | On or off. Default: On |
| Full width | Makes the button fill the width of its box. | On or off. Default: Off |
| Items | The menu entries. Each can have a label, value, icon, description, shortcut text, a separator above it, a group heading, and can be disabled, hidden or marked as destructive. | Array |
| Menu heading | A heading shown at the top of the menu. | Text |
| Menu align | How the menu lines up with the button: at its start, center or end. | Start, Center, End. Default: Start |
| Menu side | Which side of the button the menu opens on. | Bottom, Top, Right, Left. Default: Bottom |
| Options loading state | Shows placeholder lines in the menu instead of the items, for example while a query loads them. | On or off. Default: Off |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On select | Triggers when the user clicks a menu item. |
| On open | Triggers when the menu opens. |
| On close | Triggers when the menu closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Open | Opens the menu. | `components.dropdownmenu1.open()` |
| Close | Closes the menu. | `components.dropdownmenu1.close()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.dropdownmenu1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.dropdownmenu1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.dropdownmenu1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text on the button. With an icon trigger, it becomes the button's tooltip. | `{{components.dropdownmenu1.label}}` |
| `triggerType` | **Button** shows a labeled button; **Icon** shows a square icon-only button. | `{{components.dropdownmenu1.triggerType}}` |
| `variant` | Look of the button. **Destructive** is red; **Link** looks like a text link. | `{{components.dropdownmenu1.variant}}` |
| `size` | Height and text size of the button. | `{{components.dropdownmenu1.size}}` |
| `triggerIcon` | Icon shown on the button. With an icon trigger and no icon set, a three-dot icon is shown. | `{{components.dropdownmenu1.triggerIcon}}` |
| `showChevron` | Shows a down arrow after the label. | `{{components.dropdownmenu1.showChevron}}` |
| `fullWidth` | Makes the button fill the width of its box. | `{{components.dropdownmenu1.fullWidth}}` |
| `items` | The menu entries. Each can have a label, value, icon, description, shortcut text, a separator above it, a group heading, and can be disabled, hidden or marked as destructive. | `{{components.dropdownmenu1.items}}` |
| `menuLabel` | A heading shown at the top of the menu. | `{{components.dropdownmenu1.menuLabel}}` |
| `align` | How the menu lines up with the button: at its start, center or end. | `{{components.dropdownmenu1.align}}` |
| `side` | Which side of the button the menu opens on. | `{{components.dropdownmenu1.side}}` |
| `optionsLoadingState` | Shows placeholder lines in the menu instead of the items, for example while a query loads them. | `{{components.dropdownmenu1.optionsLoadingState}}` |
| `lastClickedOption` | The menu item the user clicked last, with its `label`, `description` and `value`. | `{{components.dropdownmenu1.lastClickedOption}}` |
| `selectedItem` | The value of the menu item the user clicked last. | `{{components.dropdownmenu1.selectedItem}}` |
| `isOpen` | `true` while the menu is open. | `{{components.dropdownmenu1.isOpen}}` |
| `isVisible` | Whether the component is visible. | `{{components.dropdownmenu1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.dropdownmenu1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.dropdownmenu1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Trigger background | Theme: Surface 1 |
| Trigger hover background | Theme: Surface 3 |
| Trigger text color | Theme: Primary text |
| Trigger border color | Theme: Default border |
| Trigger radius | — |
| Menu background | Theme: Surface 1 |
| Menu border color | Theme: Default border |
| Item text color | Theme: Primary text |
| Item hover background | Theme: Surface 3 |
| Item hover text color | Theme: Primary text |
| Item description and shortcut color | Theme: Placeholder text |
| Item icon color | Theme: Placeholder text |
| Destructive item color | Theme: Error |
| Menu radius | — |
| Menu width (px) | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
