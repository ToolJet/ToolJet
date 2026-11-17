---
id: card-grid
title: Card Grid
---

<div className="badge badge--primary">Ant Design</div>

The **Card Grid** component shows a list of records as a grid of cards, each with a title, an optional image, tags and details. Use it to browse items such as products, projects or recipes and pick one.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data source | The records to show, usually a query's data, one card per row. | Array |
| Title field | Field shown as each card's title. | Text. Default: `title` |
| Subtitle field | Field shown under the title. | Text |
| Image field | Field that holds an image URL, shown at the top of the card. | Text |
| Badge field | Field shown as a colored tag on the card. Common status words such as `Done` or `Overdue` get matching colors. | Text. Default: `category` |
| Badge fields | More fields to show as tags, such as `['category', 'level']`. A card shows up to four tags. | Array |
| Eyebrow field | Field shown as small text above the title, such as a category. | Text |
| Avatar field | Field shown as an avatar beside the title. An image URL shows the picture; other text shows its initials. | Text |
| Description field | Field shown as the card's body text, cut after three lines. | Text. Default: `description` |
| Progress field | Field that holds a number from 0 to 100, shown as a progress bar. | Text |
| Meta fields | Fields shown as one line of small text at the bottom of the card, such as `['owner', 'due:Due {}']`. After a colon, add a label, where `{}` marks where the value goes. | Array |
| Id field | Field that identifies each record, used for the selected item. | Text. Default: `id` |
| Layout | `stacked` puts the image above the text; `row` puts the image at the left of the text. | `stacked`, `row`. Default: `stacked` |
| Columns | Number of cards per row, up to 8. Leave it at `0` to fit as many as **Min card width** allows. | Number. Default: `0` |
| Min card width (px) | Narrowest a card gets when **Columns** is `0`, at least 120 pixels. | Number. Default: `240` |
| Image aspect | Width to height ratio of each card's image. | `16/9`, `4/3`, `1/1`. Default: `16/9` |
| Show image | Shows each card's image from **Image field**. | On or off. Default: On |
| Variant | `outlined` draws a border around each card; `borderless` uses a plain background. | `outlined`, `borderless`. Default: `outlined` |
| Hoverable | Raises a card with a shadow when the pointer is over it. | On or off. Default: On |
| Empty text | Message shown when there are no records. | Text. Default: `No items` |

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
| On card clicked | Triggers when the user clicks a card to select it. Clicking the selected card again clears the selection without firing this event. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear selection | Clears the selected card. | `components.cardgrid1.clearSelection()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.cardgrid1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.cardgrid1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.cardgrid1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `dataSource` | The records to show, usually a query's data, one card per row. | `{{components.cardgrid1.dataSource}}` |
| `titleField` | Field shown as each card's title. | `{{components.cardgrid1.titleField}}` |
| `subtitleField` | Field shown under the title. | `{{components.cardgrid1.subtitleField}}` |
| `imageField` | Field that holds an image URL, shown at the top of the card. | `{{components.cardgrid1.imageField}}` |
| `badgeField` | Field shown as a colored tag on the card. Common status words such as `Done` or `Overdue` get matching colors. | `{{components.cardgrid1.badgeField}}` |
| `badgeFields` | More fields to show as tags, such as `['category', 'level']`. A card shows up to four tags. | `{{components.cardgrid1.badgeFields}}` |
| `eyebrowField` | Field shown as small text above the title, such as a category. | `{{components.cardgrid1.eyebrowField}}` |
| `avatarField` | Field shown as an avatar beside the title. An image URL shows the picture; other text shows its initials. | `{{components.cardgrid1.avatarField}}` |
| `descriptionField` | Field shown as the card's body text, cut after three lines. | `{{components.cardgrid1.descriptionField}}` |
| `progressField` | Field that holds a number from 0 to 100, shown as a progress bar. | `{{components.cardgrid1.progressField}}` |
| `metaFields` | Fields shown as one line of small text at the bottom of the card, such as `['owner', 'due:Due {}']`. After a colon, add a label, where `{}` marks where the value goes. | `{{components.cardgrid1.metaFields}}` |
| `idField` | Field that identifies each record, used for the selected item. | `{{components.cardgrid1.idField}}` |
| `layout` | `stacked` puts the image above the text; `row` puts the image at the left of the text. | `{{components.cardgrid1.layout}}` |
| `columns` | Number of cards per row, up to 8. Leave it at `0` to fit as many as **Min card width** allows. | `{{components.cardgrid1.columns}}` |
| `minCardWidth` | Narrowest a card gets when **Columns** is `0`, at least 120 pixels. | `{{components.cardgrid1.minCardWidth}}` |
| `imageAspect` | Width to height ratio of each card's image. | `{{components.cardgrid1.imageAspect}}` |
| `showImage` | Shows each card's image from **Image field**. | `{{components.cardgrid1.showImage}}` |
| `variant` | `outlined` draws a border around each card; `borderless` uses a plain background. | `{{components.cardgrid1.variant}}` |
| `hoverable` | Raises a card with a shadow when the pointer is over it. | `{{components.cardgrid1.hoverable}}` |
| `emptyText` | Message shown when there are no records. | `{{components.cardgrid1.emptyText}}` |
| `selectedItemId` | Value of **Id field** for the selected card. | `{{components.cardgrid1.selectedItemId}}` |
| `selectedItem` | The record of the selected card. It is empty when nothing is selected. | `{{components.cardgrid1.selectedItem}}` |
| `selectedItemIndex` | Position of the selected card in **Data source**, starting at 0, or `-1` when nothing is selected. | `{{components.cardgrid1.selectedItemIndex}}` |
| `isVisible` | Whether the component is visible. | `{{components.cardgrid1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.cardgrid1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.cardgrid1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
