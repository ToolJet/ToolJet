---
id: hero
title: Hero
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Hero** component is a banner at the top of a page, with a title, subtitle, key facts and up to two action buttons. Use it for a dashboard greeting or a page header.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Eyebrow | Small text shown above the title. | Text. Default: `Operations` |
| Title | Main heading of the banner. | Text. Default: `Good morning, Ada` |
| Subtitle | Text shown under the title. | Text. Default: `Here is what needs you today.` |
| Meta facts | Short facts shown as chips under the subtitle, as a list of text or `{ label, value }` objects. | Array. Default: `["Sun, 11 Oct", "14 bookings", "3 need a reply"]` |
| Primary action label (empty hides it) | Text on the main button. Leave it empty to hide the button. | Text. Default: `New booking` |
| Secondary action label (empty hides it) | Text on the second, outlined button. Leave it empty to hide the button. | Text |
| Aside: a figure, or a list of facts | Content shown at the side of the banner: a headline figure, or a list of up to four facts. | Text |
| Aside label (the figure's caption, the facts' heading) | Heading shown above the aside figure or facts. | Text |
| Icon (lucide name, e.g. sparkles) | Icon shown next to the title, by its Lucide name, such as `sparkles`. | Text |
| Background | Look of the banner panel. **Tint**, **Gradient**, **Dark** and **Solid** are based on the accent color, **Image** uses **Background image URL**, and **Plain** has no panel. | Plain, Tint, Gradient, Image, Dark, Solid. Default: Tint |
| Background image URL (when Background is Image) | Image shown behind the banner when **Background** is **Image**. | Text |
| Align | Whether the banner's content is aligned to the left or centered. | Left, Center. Default: Left |
| Size | Padding and text size of the banner. | Compact, Default, Large. Default: Default |
| Loading look | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | Spinner, Skeleton. Default: Spinner |

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
| On action clicked | Triggers when the user clicks the main button. |
| On secondary action clicked | Triggers when the user clicks the second button. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.hero1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.hero1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.hero1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `eyebrow` | Small text shown above the title. | `{{components.hero1.eyebrow}}` |
| `title` | Main heading of the banner. | `{{components.hero1.title}}` |
| `subtitle` | Text shown under the title. | `{{components.hero1.subtitle}}` |
| `meta` | Short facts shown as chips under the subtitle, as a list of text or `{ label, value }` objects. | `{{components.hero1.meta}}` |
| `actionLabel` | Text on the main button. Leave it empty to hide the button. | `{{components.hero1.actionLabel}}` |
| `secondaryActionLabel` | Text on the second, outlined button. Leave it empty to hide the button. | `{{components.hero1.secondaryActionLabel}}` |
| `asideValue` | Content shown at the side of the banner: a headline figure, or a list of up to four facts. | `{{components.hero1.asideValue}}` |
| `asideLabel` | Heading shown above the aside figure or facts. | `{{components.hero1.asideLabel}}` |
| `icon` | Icon shown next to the title, by its Lucide name, such as `sparkles`. | `{{components.hero1.icon}}` |
| `background` | Look of the banner panel. **Tint**, **Gradient**, **Dark** and **Solid** are based on the accent color, **Image** uses **Background image URL**, and **Plain** has no panel. | `{{components.hero1.background}}` |
| `imageUrl` | Image shown behind the banner when **Background** is **Image**. | `{{components.hero1.imageUrl}}` |
| `align` | Whether the banner's content is aligned to the left or centered. | `{{components.hero1.align}}` |
| `size` | Padding and text size of the banner. | `{{components.hero1.size}}` |
| `loadingIndicator` | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | `{{components.hero1.loadingIndicator}}` |
| `isVisible` | Whether the component is visible. | `{{components.hero1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.hero1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.hero1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Accent color | Theme: Brand primary |
| Panel background color (replaces the Background choice) | — |
| Title color | Theme: Primary text |
| Subtitle and meta color | Theme: Placeholder text |
| Panel radius | — |
| Title typeface | Theme font |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
