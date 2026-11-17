---
id: kanban
title: Kanban
---

<div className="badge badge--primary">Ant Design</div>

The **Kanban** component shows records as cards in columns by status, such as tasks under To do, In progress and Done. Users drag cards between columns, and your app saves each change with a query.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Cards | The cards to show, usually a query's data, such as `{{queries.getTasks.data}}`. Each record becomes one card. | Array |
| Columns (in order) | The columns, in order, as a list of `{id, title}`. Add `color` to show a colored dot in the header. A card whose status no column lists gets its own column at the end. | Array |
| Status field | Field on each card that holds the id of the column it belongs in. | Text. Default: `status` |
| Id field | Field that identifies each card, used by the actions and in the event data. | Text. Default: `id` |
| Card content | What each card shows. `fields` shows the fields set below; `custom` repeats the components you place in the first card for every card, which read the card as `{{cardData}}`. | Fields, Custom. Default: Fields |
| Card height (custom content) | Least height of each card when **Card content** is `custom`, in pixels. A card grows to fit its components. | Number. Default: `96` |
| Title field | Field shown as each card's title. | Text. Default: `title` |
| Description field | Field shown under the title. | Text. Default: `description` |
| Badge field (priority, severity) | Field shown as a colored tag, such as a priority. Words such as `High` or `Low` get matching colors. | Text. Default: `priority` |
| Tags field (a list) | Field that holds a list of labels, each shown as a tag. | Text |
| Progress field (0 to 100) | Field that holds a number from 0 to 100, shown as a progress bar. | Text |
| Meta field (a date, a count) | Field shown as small text on the card, such as a due date or a count. | Text |
| Avatar field (a name or image URL) | Field shown as an avatar on the card. An image URL shows the picture; a name shows its initials. | Text. Default: `owner` |
| Details field (shown on the clicked card) | Field shown as a list of label and value pairs when the user clicks the card. It can hold an object of label and value, a list of `{label, value}` or plain text. | Text |
| Card density | `compact` uses less padding on each card, so more cards fit. | Comfortable, Compact. Default: Comfortable |
| Collapsed card height (px, empty: show all) | Height in pixels that a long card is cut to, with a **Show more** button to open it. Leave it empty to show cards in full. | Text |
| Column width (px, empty: fill the board) | Width of each column in pixels. Leave it empty for columns of equal width that fill the board. | Text |
| Card count on columns | Shows the number of cards in each column's header. | On or off. Default: On |
| Collapsible columns | Shows a button in each column's header that folds the column to a narrow strip. | On or off. Default: On |
| Columns collapsed at start (ids) | Ids of the columns that are folded when the app loads. | Array |
| Drag to move | Lets users move cards between and within columns by dragging, or with the keyboard. | On or off. Default: On |
| Add card button on columns | Shows an **Add card** button at the bottom of each column. It fires **On add card click**; your app adds the card. | On or off. Default: Off |
| Delete button on cards | Shows a delete button on each card that removes it from the board. | On or off. Default: Off |
| Empty column message | Message shown in a column with no cards. | Text. Default: `No cards` |
| Badge colours by value | Colors for badge values, such as `{ High: '#dc2626' }`. A value can also be `{text, background}` to set both colors. | Object |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On card moved](../common-settings.md#events) | Triggers when a card moves to another column or place, by the user or the **Move card** action. |
| [On add card click](../common-settings.md#events) | Triggers when the user clicks a column's **Add card** button. |
| [On card added](../common-settings.md#events) | Triggers when the **Add card** action adds a card. |
| [On card updated](../common-settings.md#events) | Triggers when the **Update card data** action changes a card. |
| [On card removed](../common-settings.md#events) | Triggers when a card is deleted, by its delete button or the **Delete card** action. |
| [On card selected](../common-settings.md#events) | Triggers when the user clicks a card to select it. Clicking the selected card again clears the selection without firing this event. |
| [On update](../common-settings.md#events) | Triggers when the cards change in any way: a move, an add, an update or a delete. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Add card | Adds the given **Card** to the board, in the column given by **Column id**, else in the column its status names, else in the first column. | `components.kanban1.addCard("{{{ title: 'New card' }}}", "")` |
| Move card | Moves the card with the given **Card id** to the end of the column with the given **Column id**. | `components.kanban1.moveCard("", "")` |
| Delete card | Removes the card with the given **Card id** from the board. | `components.kanban1.deleteCard("")` |
| Update card data | Changes fields of the card with the given **Card id** to the given **Values**, such as `{ title: 'Renamed' }`. | `components.kanban1.updateCardData("", "{{{ title: 'Renamed' }}}")` |
| Clear selection | Clears the selected card and closes its details. | `components.kanban1.clearSelection()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `dataSource` | The cards to show, usually a query's data, such as `{{queries.getTasks.data}}`. Each record becomes one card. | `{{components.kanban1.dataSource}}` |
| `columns` | The columns, in order, as a list of `{id, title}`. Add `color` to show a colored dot in the header. A card whose status no column lists gets its own column at the end. | `{{components.kanban1.columns}}` |
| `statusField` | Field on each card that holds the id of the column it belongs in. | `{{components.kanban1.statusField}}` |
| `idField` | Field that identifies each card, used by the actions and in the event data. | `{{components.kanban1.idField}}` |
| `cardLayout` | What each card shows. `fields` shows the fields set below; `custom` repeats the components you place in the first card for every card, which read the card as `{{cardData}}`. | `{{components.kanban1.cardLayout}}` |
| `cardHeight` | Least height of each card when **Card content** is `custom`, in pixels. A card grows to fit its components. | `{{components.kanban1.cardHeight}}` |
| `titleField` | Field shown as each card's title. | `{{components.kanban1.titleField}}` |
| `descriptionField` | Field shown under the title. | `{{components.kanban1.descriptionField}}` |
| `badgeField` | Field shown as a colored tag, such as a priority. Words such as `High` or `Low` get matching colors. | `{{components.kanban1.badgeField}}` |
| `tagsField` | Field that holds a list of labels, each shown as a tag. | `{{components.kanban1.tagsField}}` |
| `progressField` | Field that holds a number from 0 to 100, shown as a progress bar. | `{{components.kanban1.progressField}}` |
| `metaField` | Field shown as small text on the card, such as a due date or a count. | `{{components.kanban1.metaField}}` |
| `avatarField` | Field shown as an avatar on the card. An image URL shows the picture; a name shows its initials. | `{{components.kanban1.avatarField}}` |
| `detailsField` | Field shown as a list of label and value pairs when the user clicks the card. It can hold an object of label and value, a list of `{label, value}` or plain text. | `{{components.kanban1.detailsField}}` |
| `density` | `compact` uses less padding on each card, so more cards fit. | `{{components.kanban1.density}}` |
| `collapsedHeight` | Height in pixels that a long card is cut to, with a **Show more** button to open it. Leave it empty to show cards in full. | `{{components.kanban1.collapsedHeight}}` |
| `columnWidth` | Width of each column in pixels. Leave it empty for columns of equal width that fill the board. | `{{components.kanban1.columnWidth}}` |
| `showCount` | Shows the number of cards in each column's header. | `{{components.kanban1.showCount}}` |
| `collapsibleColumns` | Shows a button in each column's header that folds the column to a narrow strip. | `{{components.kanban1.collapsibleColumns}}` |
| `collapsedColumns` | Ids of the columns that are folded when the app loads. | `{{components.kanban1.collapsedColumns}}` |
| `allowDrag` | Lets users move cards between and within columns by dragging, or with the keyboard. | `{{components.kanban1.allowDrag}}` |
| `allowAdd` | Shows an **Add card** button at the bottom of each column. It fires **On add card click**; your app adds the card. | `{{components.kanban1.allowAdd}}` |
| `allowDelete` | Shows a delete button on each card that removes it from the board. | `{{components.kanban1.allowDelete}}` |
| `emptyText` | Message shown in a column with no cards. | `{{components.kanban1.emptyText}}` |
| `badgeColors` | Colors for badge values, such as `{ High: '#dc2626' }`. A value can also be `{text, background}` to set both colors. | `{{components.kanban1.badgeColors}}` |
| `updatedCardData` | Every card on the board as it is now, after the latest moves, adds, updates and deletes. Save it with a query to keep the changes. | `{{components.kanban1.updatedCardData}}` |
| `lastSelectedCard` | The card the user selected last. It is empty when nothing is selected. | `{{components.kanban1.lastSelectedCard}}` |
| `lastCardMovement` | Details of the last move, including `cardId`, `card`, `originColumnId` and `destinationColumnId`. | `{{components.kanban1.lastCardMovement}}` |
| `addCardColumn` | Id of the column whose **Add card** button the user clicked last. | `{{components.kanban1.addCardColumn}}` |
| `lastAddedCard` | The card the **Add card** action added last. | `{{components.kanban1.lastAddedCard}}` |
| `lastUpdatedCard` | The card as it is after the last **Update card data** action. | `{{components.kanban1.lastUpdatedCard}}` |
| `lastRemovedCard` | The card deleted last. | `{{components.kanban1.lastRemovedCard}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Column background | Theme: Surface 2 |
| Column border color | Theme: Weak border |
| Column title color | Theme: Primary text |
| Column count background | Theme: Surface 3 |
| Column count text color | Theme: Primary text |
| Gap between columns | — |
| Column radius | — |
| Card background | Theme: Surface 1 |
| Card border color | Theme: Weak border |
| Card title color | Theme: Primary text |
| Card secondary text color | Theme: Placeholder text |
| Progress color (else the primary) | Theme: Brand primary |
| Card radius | — |
| Card shadow | None |
