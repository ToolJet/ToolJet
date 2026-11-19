---
id: kanban
title: Kanban
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Kanban** component shows records as cards on a board, with one column per status, so users can track work such as tasks, tickets or deals and drag cards between stages. Each change updates the board at once and is exposed for a query to save.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Cards | The cards to show, as a list of records, for example `{{queries.getTasks.data}}`. | Array |
| Columns (in order) | The board's columns in order, each with an `id` and a `title`, and optionally a `color` that adds a dot. A status that no column lists gets its own column at the end. | Array |
| Status field | The field in each card whose value decides which column the card sits in. Moving a card changes this field. | Text. Default: `status` |
| Id field | The field that identifies each card. Actions such as **Move card** and **Delete card** find cards by this value. | Text. Default: `id` |
| Card content | What each card shows. **Fields** builds the card from the field properties below; **Custom** builds the card from components that read the card as `{{cardData}}`. | Fields, Custom. Default: Fields |
| Card height (custom content) | Minimum height of each card when **Card content** is **Custom**. A card grows to fit its components. | Number. Default: `96` |
| Title field | The field shown as the card's title. | Text. Default: `title` |
| Description field | The field shown as text under the title. Leave empty to hide it. | Text |
| Badge field (priority, severity) | The field shown as a colored badge, such as a priority or severity. Common words like `High` or `Low` get a matching color. | Text. Default: `priority` |
| Tags field (a list) | A field holding a list, or comma-separated text, shown as tags on the card. | Text |
| Progress field (0 to 100) | A field holding a number from `0` to `100`, shown as a progress bar. | Text |
| Meta field (a date, a count) | A field shown in small text at the bottom of the card, such as a due date or a count. Dates are shown in a short format. | Text |
| Avatar field (a name) | A field holding a name, shown as an avatar with the person's initials. | Text. Default: `owner` |
| Details field (shown on the clicked card) | A field whose contents are shown on a card when the user clicks it, for extra information that would crowd the board. | Text |
| Card density | Spacing inside cards. **Compact** fits more cards on screen. | Comfortable, Compact. Default: Comfortable |
| Collapsed card height (px, empty: show all) | A height in pixels at which long cards are cut off, with a **Show more** button to expand them. Leave empty to show cards in full. | Text |
| Column width (px, empty: fill the board) | A fixed width in pixels for every column. The board scrolls sideways when the columns don't fit. Leave empty for equal-width columns that fill the board. | Text |
| Card count on columns | Shows the number of cards next to each column title. | On or off. Default: On |
| Collapsible columns | Shows a button on each column header that collapses the column to a narrow strip. | On or off. Default: On |
| Columns collapsed at start (ids) | The ids of columns that start collapsed. | Array |
| Drag to move | Lets users drag cards to reorder them or move them to another column. | On or off. Default: On |
| Add card button on columns | Shows an **Add card** button at the bottom of each column. Clicking it fires **On add card click**, which can open a form. It does not add a card by itself. | On or off. Default: Off |
| Delete button on cards | Shows a delete button on each card that removes the card from the board. | On or off. Default: Off |
| Empty column message | Text shown in a column that has no cards. | Text. Default: `No cards` |
| Badge colours by value | Colors for badge values, for example `{ High: '#dc2626' }`. A value can also be `{ text, background }`. | Object |
| Loading look | What shows while the component is loading: a **Spinner** or a **Skeleton** outline of the board. A board that already has cards stays visible under a light overlay. | Spinner, Skeleton. Default: Spinner |

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
| On card moved | Triggers when a card moves to a new position or column, by dragging or with **Move card**. |
| On add card click | Triggers when the user clicks a column's **Add card** button. |
| On card added | Triggers when a card is added with **Add card**. |
| On card updated | Triggers when a card is changed with **Update card data**. |
| On card removed | Triggers when a card is deleted, with its delete button or with **Delete card**. |
| On card selected | Triggers when the user selects a card. |
| On update | Triggers when any card changes: a move, add, update or delete. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Add card | Adds a **Card** to the board. Give a **Column id** to place it in that column; otherwise it goes to the column for its status, or the first column. | `components.kanban1.addCard("{{{ title: 'New card' }}}", "")` |
| Move card | Moves the card with the given **Card id** to the end of the column with the given **Column id**. | `components.kanban1.moveCard("", "")` |
| Delete card | Removes the card with the given **Card id** from the board. | `components.kanban1.deleteCard("")` |
| Update card data | Changes the fields in **Values** on the card with the given **Card id**. | `components.kanban1.updateCardData("", "{{{ title: 'Renamed' }}}")` |
| Clear selection | Clears the selected card and closes its details. | `components.kanban1.clearSelection()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.kanban1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.kanban1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.kanban1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The cards to show, as a list of records, for example `{{queries.getTasks.data}}`. | `{{components.kanban1.data}}` |
| `columns` | The board's columns in order, each with an `id` and a `title`, and optionally a `color` that adds a dot. A status that no column lists gets its own column at the end. | `{{components.kanban1.columns}}` |
| `statusField` | The field in each card whose value decides which column the card sits in. Moving a card changes this field. | `{{components.kanban1.statusField}}` |
| `idField` | The field that identifies each card. Actions such as **Move card** and **Delete card** find cards by this value. | `{{components.kanban1.idField}}` |
| `cardLayout` | What each card shows. **Fields** builds the card from the field properties below; **Custom** builds the card from components that read the card as `{{cardData}}`. | `{{components.kanban1.cardLayout}}` |
| `cardHeight` | Minimum height of each card when **Card content** is **Custom**. A card grows to fit its components. | `{{components.kanban1.cardHeight}}` |
| `titleField` | The field shown as the card's title. | `{{components.kanban1.titleField}}` |
| `descriptionField` | The field shown as text under the title. Leave empty to hide it. | `{{components.kanban1.descriptionField}}` |
| `badgeField` | The field shown as a colored badge, such as a priority or severity. Common words like `High` or `Low` get a matching color. | `{{components.kanban1.badgeField}}` |
| `tagsField` | A field holding a list, or comma-separated text, shown as tags on the card. | `{{components.kanban1.tagsField}}` |
| `progressField` | A field holding a number from `0` to `100`, shown as a progress bar. | `{{components.kanban1.progressField}}` |
| `metaField` | A field shown in small text at the bottom of the card, such as a due date or a count. Dates are shown in a short format. | `{{components.kanban1.metaField}}` |
| `avatarField` | A field holding a name, shown as an avatar with the person's initials. | `{{components.kanban1.avatarField}}` |
| `detailsField` | A field whose contents are shown on a card when the user clicks it, for extra information that would crowd the board. | `{{components.kanban1.detailsField}}` |
| `density` | Spacing inside cards. **Compact** fits more cards on screen. | `{{components.kanban1.density}}` |
| `collapsedHeight` | A height in pixels at which long cards are cut off, with a **Show more** button to expand them. Leave empty to show cards in full. | `{{components.kanban1.collapsedHeight}}` |
| `columnWidth` | A fixed width in pixels for every column. The board scrolls sideways when the columns don't fit. Leave empty for equal-width columns that fill the board. | `{{components.kanban1.columnWidth}}` |
| `showCount` | Shows the number of cards next to each column title. | `{{components.kanban1.showCount}}` |
| `collapsibleColumns` | Shows a button on each column header that collapses the column to a narrow strip. | `{{components.kanban1.collapsibleColumns}}` |
| `collapsedColumns` | The ids of columns that start collapsed. | `{{components.kanban1.collapsedColumns}}` |
| `allowDrag` | Lets users drag cards to reorder them or move them to another column. | `{{components.kanban1.allowDrag}}` |
| `allowAdd` | Shows an **Add card** button at the bottom of each column. Clicking it fires **On add card click**, which can open a form. It does not add a card by itself. | `{{components.kanban1.allowAdd}}` |
| `allowDelete` | Shows a delete button on each card that removes the card from the board. | `{{components.kanban1.allowDelete}}` |
| `emptyText` | Text shown in a column that has no cards. | `{{components.kanban1.emptyText}}` |
| `badgeColors` | Colors for badge values, for example `{ High: '#dc2626' }`. A value can also be `{ text, background }`. | `{{components.kanban1.badgeColors}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a **Skeleton** outline of the board. A board that already has cards stays visible under a light overlay. | `{{components.kanban1.loadingIndicator}}` |
| `updatedCardData` | All cards on the board after the latest change, ready for a query to save. | `{{components.kanban1.updatedCardData}}` |
| `lastSelectedCard` | The card the user selected most recently. | `{{components.kanban1.lastSelectedCard}}` |
| `lastCardMovement` | Details of the most recent card move, including the card, its `originColumnId` and `destinationColumnId`, and its position before and after. | `{{components.kanban1.lastCardMovement}}` |
| `addCardColumn` | The id of the column whose **Add card** button was clicked last. | `{{components.kanban1.addCardColumn}}` |
| `lastAddedCard` | The card added most recently. | `{{components.kanban1.lastAddedCard}}` |
| `lastUpdatedCard` | The card changed most recently, with its new values. | `{{components.kanban1.lastUpdatedCard}}` |
| `lastRemovedCard` | The card deleted most recently. | `{{components.kanban1.lastRemovedCard}}` |
| `isVisible` | Whether the component is visible. | `{{components.kanban1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.kanban1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.kanban1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Accent (selection, progress, drop line) | Theme: Brand primary |
| Column background | Theme: Surface 3 |
| Column border color | `transparent` |
| Column title color | Theme: Primary text |
| Column count background | Theme: Brand primary |
| Column count text color | Theme: Brand primary |
| Gap between columns | `16` |
| Column radius | — |
| Card background | Theme: Surface 1 |
| Card border color | Theme: Default border |
| Card title color | Theme: Primary text |
| Card secondary text color | Theme: Placeholder text |
| Progress color (else the accent) | Theme: Brand primary |
| Card radius | — |
| Card shadow | Small |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
