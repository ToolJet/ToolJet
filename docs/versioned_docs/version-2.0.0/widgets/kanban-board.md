---
id: kanban
title: Kanban
---

# Kanban

Kanban widget allows you to visually organize and prioritize your tasks with a transparent workflow. You can set the number of columns to display, enable/disable the add cards button, and bind data to the cards.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/kanban/kanban.png" alt="ToolJet - Widget Reference - Kanban widget" />

</div>

## Events

To add an event, click on the widget handle to open the widget properties on the right sidebar. Go to the **Events** section and click on **Add handler**.

- **[Card added](#card-added)**
- **[Card removed](#card-removed)**
- **[Card moved](#card-moved)**
- **[Card selected](#card-selected)**
- **[Card updated](#card-updated)**

Just like any other event on ToolJet, you can set multiple handlers for any of the above mentioned events.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/kanban/kanban-events.png" alt="ToolJet - Widget Reference - Kanban widget" />

</div>

## Properties

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/kanban/properties.png" alt="ToolJet - Widget Reference - Kanban widget" />

</div>

:::caution
Please keep in mind that you need to provide an `id` for each card in the `Card data` field <br />
and this `id` must be of type string.
:::

| Properties | description | Expected value |
| ----------- | ----------- | ----------- |
| Columns | Enter the columns data - `id` and `title` in the form of array of objects or from a query that returns an array of objects. | `{{[{ "id": "1", "title": "to do" },{ "id": "2", "title": "in progress" },{ "id": "2", "title": "Completed" }]}}` or `{{queries.xyz.data}}` |
| Card data | Enter the cards data - `id`, `title` and `columnId` in the form of array of objects or from a query that returns an array of objects. | `{{[{ id: "01", title: "one", columnId: "1" },{ id: "02", title: "two", columnId: "1" },{ id: "03", title: "three", columnId: "2" }]}}` or `{{queries.abc.data}}` |
| Enable Add Card | This property allows you to show or hide the `Add Cards` button at the bottom of every column. | By default its enabled, you can programmatically set `{{true}}` or `{{false}}` enable/disable button by clicking on the `Fx` next to it |

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Kanban widget" />

</div>

## Layout

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/kanban/layout.png" alt="ToolJet - Widget Reference - Kanban widget" />

</div>

| Layout          | description                                             | Expected value                                                                                        |
| --------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display the widget in desktop view. | You can programmatically set the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display the widget in mobile view.  | You can programmatically set the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

## Styles

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/kanban/styles.png" alt="ToolJet - Widget Reference - Kanban widget" />

</div>

| Style        | Description                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Disable      | If disabled or set to `{{false}}` the widget will be locked and becomes non-functional. By default, its disabled i.e. its value is set to `{{true}}` .                        |
| Visibility   | This is to control the visibility of the widget. If `{{false}}`/disabled the widget will not visible after the app is deployed. By default, it's enabled (set to `{{true}}`). |
| Width        | This property sets the width of the column.                                                                                                                                   |
| Min width    | This property sets the min width of the column.                                                                                                                               |
| Accent color | You can change the accent color of the column title by entering the Hex color code or choosing a color of your choice from the color picker.                                  |

## Exposed variables

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/kanban/variables.png" alt="ToolJet - Widget Reference - Kanban widget" />

</div>

| Variable | Description |
| -------- | ----------- |
| columns | The `columns` variable is an array of objects that includes the columns data in the respective objects. Since the columns variable is an array you'll need to specify the index of the object in the array to get the data within that object. Each object within a column has two keys - `id` and `title` and an array `cards` which is again an array of objects. Example: If you want to get the title of second card then you'll use `{{components.kanbanboard1.columns[1].title}}` - here we have specified the array index as `[1]` and then key which is the `title`. Similarly you can get the card details using `{{components.kanbanboard1.columns[0].cards[1].title}}` |
| lastAddedCard | The variable `lastAddedCard` holds the properties of the card that has been added lastly. It holds the following data - `id`, `title`, and `columnId` of the last added card. You can get the values using `{{components.kanbanboard1.lastAddedCard.title}}` |
| lastRemovedCard | The variable `lastRemovedCard` holds the properties of the card that has been recently deleted from the kanban. It holds the following data - `id`, `title`, and `columnId` of the recently deleted card. You can get the values using `{{components.kanbanboard1.lastRemovedCard.title}}` |
| lastCardMovement | The variable `lastCardMovement` holds the properties of the card that has been recently moved from its original position. It holds the following data - `originColumnId`, `destinationColumnId`, `originCardIndex`, `destinationCardIndex` and an object `cardDetails` which includes `title`. You can get the values using `{{components.kanbanboard1.lastCardMovement.cardDetails.title}}` or `{{components.kanbanboard1.lastCardMovement.destinationCardIndex}}` |
| lastUpdatedCard | The variable `lastUpdatedCard` holds `id`, `title`, and `columnId` of the latest modified card. You can get the values using `{{components.kanbanboard1.lastUpdatedCard.columnId}}` |
| selectedCard | The variable `selectedCard` holds `id`, `title`, `columnId`, and `description` of the selected card in the kanban. You can get the values using `{{components.kanbanboard1.selectedCard.description}}` |