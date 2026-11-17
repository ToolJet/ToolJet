---
id: drawer
title: Drawer
---

<div className="badge badge--primary">Ant Design</div>

The **Drawer** component is a panel that slides in from the edge of the screen and holds its own components. Use it for details or a form that opens beside the page, such as editing a selected record.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Trigger text | Text of the button that opens the drawer. | Text. Default: `Open` |
| Show trigger | Shows the button that opens the drawer. Turn it off to open the drawer only with the **Show** action. | On or off. Default: On |
| Title | Heading at the top of the drawer. | Text. Default: `Drawer title` |
| Extra | Text shown at the right of the drawer's header. | Text |
| Placement | Which edge of the screen the drawer slides in from. | `right`, `left`, `top`, `bottom`. Default: `right` |
| Size | Width of the drawer, or its height when it opens from the top or bottom. `default` is 378 pixels and `large` is 736 pixels. | `default`, `large`. Default: `default` |
| Width (px) | A width in pixels, or a height when the drawer opens from the top or bottom. It overrides **Size**; leave it at `0` to use **Size**. | Number. Default: `0` |
| Closable | Shows a close button in the drawer's header. | On or off. Default: On |
| Mask closable | Closes the drawer when the user clicks the shaded area outside it. | On or off. Default: On |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On close](../common-settings.md#events) | Triggers when the user closes the drawer, by its close button, the shaded area or the Esc key. |
| [After open](../common-settings.md#events) | Triggers when the drawer has finished opening. |
| [After close](../common-settings.md#events) | Triggers when the drawer has finished closing. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Show | Opens the drawer. | `components.drawer1.show()` |
| Hide | Closes the drawer. | `components.drawer1.hide()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `triggerText` | Text of the button that opens the drawer. | `{{components.drawer1.triggerText}}` |
| `showTrigger` | Shows the button that opens the drawer. Turn it off to open the drawer only with the **Show** action. | `{{components.drawer1.showTrigger}}` |
| `title` | Heading at the top of the drawer. | `{{components.drawer1.title}}` |
| `extra` | Text shown at the right of the drawer's header. | `{{components.drawer1.extra}}` |
| `placement` | Which edge of the screen the drawer slides in from. | `{{components.drawer1.placement}}` |
| `size` | Width of the drawer, or its height when it opens from the top or bottom. `default` is 378 pixels and `large` is 736 pixels. | `{{components.drawer1.size}}` |
| `width` | A width in pixels, or a height when the drawer opens from the top or bottom. It overrides **Size**; leave it at `0` to use **Size**. | `{{components.drawer1.width}}` |
| `closable` | Shows a close button in the drawer's header. | `{{components.drawer1.closable}}` |
| `maskClosable` | Closes the drawer when the user clicks the shaded area outside it. | `{{components.drawer1.maskClosable}}` |
| `open` | `true` while the drawer is open. | `{{components.drawer1.open}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
