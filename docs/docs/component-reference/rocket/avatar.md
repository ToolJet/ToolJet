---
id: avatar
title: Avatar
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Avatar** component shows a person's photo, or their initials when there is no photo. With several names it shows an overlapping stack, such as the members of a team.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Names (one or many; or [\{ name, src \}]) | The people to show: one name, a comma-separated list, or a list of `{ name, src }` objects where `src` is a photo URL. | Text. Default: `Ada Lovelace` |
| Image URL (single avatar) | Photo URL used when **Names** holds a single person without their own photo. | Text |
| Size (px) | Width and height of each avatar in pixels. The avatar never grows past the component's height. | Text. Default: `32` |
| Most avatars shown (rest as +N) | How many avatars to show before the rest are grouped as `+N`. | Number. Default: `5` |
| Image URL (when Names is empty) | Photo URL for the single person set in **Name** when **Names** is empty. | Text |
| Name (when Names is empty) | Name of a single person, used when **Names** is empty. | Text |
| Subtitle | Second line shown under the name when **Show name and subtitle** is on, such as a job title. | Text |
| Show name and subtitle | Shows the person's name and **Subtitle** next to the avatar. It applies only when one person is shown. | On or off. Default: Off |
| Shape | Shape of each avatar: round or square. | Circle, Square. Default: Circle |
| Loading look | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | Spinner, Skeleton. Default: Spinner |

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
| On click | Triggers when the user clicks the avatar. |

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
| `names` | The people to show: one name, a comma-separated list, or a list of `{ name, src }` objects where `src` is a photo URL. | `{{components.avatar1.names}}` |
| `src` | Photo URL used when **Names** holds a single person without their own photo. | `{{components.avatar1.src}}` |
| `size` | Width and height of each avatar in pixels. The avatar never grows past the component's height. | `{{components.avatar1.size}}` |
| `maxVisible` | How many avatars to show before the rest are grouped as `+N`. | `{{components.avatar1.maxVisible}}` |
| `imageUrl` | Photo URL for the single person set in **Name** when **Names** is empty. | `{{components.avatar1.imageUrl}}` |
| `name` | Name of a single person, used when **Names** is empty. | `{{components.avatar1.name}}` |
| `subtitle` | Second line shown under the name when **Show name and subtitle** is on, such as a job title. | `{{components.avatar1.subtitle}}` |
| `showDetails` | Shows the person's name and **Subtitle** next to the avatar. It applies only when one person is shown. | `{{components.avatar1.showDetails}}` |
| `shape` | Shape of each avatar: round or square. | `{{components.avatar1.shape}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | `{{components.avatar1.loadingIndicator}}` |
| `isVisible` | Whether the component is visible. | `{{components.avatar1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.avatar1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.avatar1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Initials background | Theme: Surface 3 |
| Initials color | Theme: Primary text |
| Ring color (between stacked avatars) | Theme: Surface 1 |
| Initials background (old name) | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
