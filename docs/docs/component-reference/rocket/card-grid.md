---
id: card-grid
title: Card Grid
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Card Grid** component shows a list of records as cards in a grid, each built from fields of the data, such as a title, image, badges and a short description. Use it for catalogs, project boards or team directories.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | The records to show, one card per row, usually from a query. | Array |
| Title field | The field shown as each card's title. | Text. Default: `name` |
| Subtitle field | The field shown under the title. | Text |
| Image field (URL) | The field that holds an image URL for each card. Cards show a picture only when this is set. | Text |
| Badge field | The field shown as a badge next to the title. | Text. Default: `cuisine` |
| More badge fields (comma list, e.g. 'diet, spice') | More fields shown as badges, as a comma-separated list such as `diet, spice`. | Text |
| Eyebrow field (a small line above the title) | The field shown as a small line above the title. | Text |
| Avatar field (image URL or a name) | The field shown as an avatar, holding an image URL or a name to show as initials. | Text |
| Description field | The field shown as the card's body text. | Text. Default: `note` |
| Progress field (a percentage, 0 to 100) | The field shown as a progress bar, holding a percentage from `0` to `100`. | Text |
| Meta fields (comma list; 'prep:\{\} min') | Fields shown in a small line at the bottom of the card, comma-separated. Add a label after a colon, with `{}` where the value goes, such as `prep:{} min`. | Text. Default: `prep:{} min, serves:Serves` |
| Id field | The field that identifies each record. Its value for the selected card is exposed as **selectedItemId**. | Text. Default: `id` |
| Layout | `stacked` puts the image above the text; `row` puts it beside the text. | `stacked`, `row`. Default: `stacked` |
| Columns (0 fits as many as the width allows) | How many cards to show per row. Use `0` to fit as many as the width allows. | Number. Default: `3` |
| Minimum card width (px) | The narrowest a card can get. The grid shows fewer columns rather than squeeze cards below it. | Number. Default: `240` |
| Image shape | Width-to-height shape of the card images. | `16/9`, `4/3`, `1/1`. Default: `4/3` |
| Show image | Shows the picture area on each card when **Image field** is set. | On or off. Default: On |
| Card style | Look of the cards: with a shadow (`elevated`), with a border (`outline`) or plain (`flat`). | `elevated`, `outline`, `flat`. Default: `elevated` |
| Highlight the selected card | Highlights the selected card. When on, clicking the selected card again clears the selection. | On or off. Default: On |
| Empty text | Message shown when there are no records. | Text. Default: `Nothing here yet` |
| Loading look | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On card clicked](../common-settings.md#events) | Triggers when the user clicks a card. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear selection | Clears the selected card. | `components.cardgrid1.clearSelection()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The records to show, one card per row, usually from a query. | `{{components.cardgrid1.data}}` |
| `titleField` | The field shown as each card's title. | `{{components.cardgrid1.titleField}}` |
| `subtitleField` | The field shown under the title. | `{{components.cardgrid1.subtitleField}}` |
| `imageField` | The field that holds an image URL for each card. Cards show a picture only when this is set. | `{{components.cardgrid1.imageField}}` |
| `badgeField` | The field shown as a badge next to the title. | `{{components.cardgrid1.badgeField}}` |
| `badgeFields` | More fields shown as badges, as a comma-separated list such as `diet, spice`. | `{{components.cardgrid1.badgeFields}}` |
| `eyebrowField` | The field shown as a small line above the title. | `{{components.cardgrid1.eyebrowField}}` |
| `avatarField` | The field shown as an avatar, holding an image URL or a name to show as initials. | `{{components.cardgrid1.avatarField}}` |
| `descriptionField` | The field shown as the card's body text. | `{{components.cardgrid1.descriptionField}}` |
| `progressField` | The field shown as a progress bar, holding a percentage from `0` to `100`. | `{{components.cardgrid1.progressField}}` |
| `metaFields` | Fields shown in a small line at the bottom of the card, comma-separated. Add a label after a colon, with `{}` where the value goes, such as `prep:{} min`. | `{{components.cardgrid1.metaFields}}` |
| `idField` | The field that identifies each record. Its value for the selected card is exposed as **selectedItemId**. | `{{components.cardgrid1.idField}}` |
| `layout` | `stacked` puts the image above the text; `row` puts it beside the text. | `{{components.cardgrid1.layout}}` |
| `columns` | How many cards to show per row. Use `0` to fit as many as the width allows. | `{{components.cardgrid1.columns}}` |
| `minCardWidth` | The narrowest a card can get. The grid shows fewer columns rather than squeeze cards below it. | `{{components.cardgrid1.minCardWidth}}` |
| `imageAspect` | Width-to-height shape of the card images. | `{{components.cardgrid1.imageAspect}}` |
| `showImage` | Shows the picture area on each card when **Image field** is set. | `{{components.cardgrid1.showImage}}` |
| `cardStyle` | Look of the cards: with a shadow (`elevated`), with a border (`outline`) or plain (`flat`). | `{{components.cardgrid1.cardStyle}}` |
| `highlightSelected` | Highlights the selected card. When on, clicking the selected card again clears the selection. | `{{components.cardgrid1.highlightSelected}}` |
| `emptyText` | Message shown when there are no records. | `{{components.cardgrid1.emptyText}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | `{{components.cardgrid1.loadingIndicator}}` |
| `selectedItemId` | Value of the **Id field** for the selected card. | `{{components.cardgrid1.selectedItemId}}` |
| `selectedItem` | The data row of the selected card. | `{{components.cardgrid1.selectedItem}}` |
| `selectedItemIndex` | Position of the selected card, counting from `0`, or `-1` with none selected. | `{{components.cardgrid1.selectedItemIndex}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Card background | Theme: Surface 1 |
| Card border color | Theme: Default border |
| Title color | Theme: Primary text |
| Subtitle and meta color | Theme: Placeholder text |
| Selected card accent | Theme: Brand primary |
| Card radius | — |
| Title typeface | Theme font |
