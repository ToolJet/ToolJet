---
id: avatar
title: Avatar
---

<div className="badge badge--primary">Ant Design</div>

The **Avatar** component shows a user's picture, or their initials when there is no picture, for example next to a name in a profile or a list.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Src | URL of the image to show. | Text |
| Text | Text shown when there is no image. A full name with a space shows its initials, such as `AL` for Ada Lovelace. | Text. Default: `AL` |
| Alt | Alternative text for the image, read by screen readers. When empty, **Text** is used. | Text |
| Shape | Whether the avatar is round or a square with rounded corners. | `circle`, `square`. Default: `circle` |
| Size (px) | Width and height of the avatar, from 16 to 240 pixels. It shrinks to fit a smaller box. | Number. Default: `40` |

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

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.avatar1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.avatar1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.avatar1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `src` | URL of the image to show. | `{{components.avatar1.src}}` |
| `children` | Text shown when there is no image. A full name with a space shows its initials, such as `AL` for Ada Lovelace. | `{{components.avatar1.children}}` |
| `alt` | Alternative text for the image, read by screen readers. When empty, **Text** is used. | `{{components.avatar1.alt}}` |
| `shape` | Whether the avatar is round or a square with rounded corners. | `{{components.avatar1.shape}}` |
| `size` | Width and height of the avatar, from 16 to 240 pixels. It shrinks to fit a smaller box. | `{{components.avatar1.size}}` |
| `isVisible` | Whether the component is visible. | `{{components.avatar1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.avatar1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.avatar1.isDisabled}}` |

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
