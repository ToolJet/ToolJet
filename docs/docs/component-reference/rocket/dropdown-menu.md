---
id: dropdown-menu
title: Dropdown Menu
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Dropdown Menu** component is a button that opens a list of actions, such as **Edit**, **Duplicate** or **Delete**. Use it to group row or record actions without crowding the page.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On select](../common-settings.md#events) | Triggers when the user clicks a menu item. |
| [On open](../common-settings.md#events) | Triggers when the menu opens. |
| [On close](../common-settings.md#events) | Triggers when the menu closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Open | Opens the menu. | `components.dropdownmenu1.open()` |
| Close | Closes the menu. | `components.dropdownmenu1.close()` |

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
| Destructive item color | `var(--cc-error-systemStatus)` |
| Menu radius | — |
| Menu width (px) | — |
