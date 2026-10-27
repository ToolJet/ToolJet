---
id: kanban
title: Kanban
---

The **Kanban** component allows you to visually organize and prioritize your tasks with a transparent workflow. You can set the number of columns to display, enable/disable the add cards button, and bind data to the cards.

:::info Restricted components
Certain components are restricted from being placed within the **Card** and **Popout** of the **Kanban** component.

- **Card**: Calendar, Kanban, Form, Tabs, Modal, ListView, Container, Accordion, Table
- **Popout**: Calendar, Kanban
  :::

## Setting Card Data

To dynamically populate Kanban cards, you can use the `cardData` key.

For instance, you can set the `Data` property of a Text component on a card using the below code:

```js
{
  {
    cardData.title;
  }
}
// Replace title with the key in your data
```

## Properties

:::info

- It is mandatory to provide an `id` for each column in the `Column data` field. The `id` can be of type `string` or `number`.
- It is mandatory to provide an `id` and a `columnId` for each card in the `Card data` field. Both `id` and `columnId` can be of type `string` or `number`.
  :::

| <div style={{ width:"100px"}}> Properties </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Column data | Enter the columns data - `id` and `title` in the form of array of objects or from a query that returns an array of objects.           | `{{[{ "id": "c1", "title": "to do" },{ "id": "c2", "title": "in progress" },{ "id": "c3", "title": "Completed" }]}}` or `{{queries.xyz.data}}`. |
| Card data | Enter the cards data - `id`, `title` and `columnId` in the form of array of objects or from a query that returns an array of objects. | `{{[{ id: "r1", title: "Title 1", description: "Description 1", columnId: "c1" },{ id: "r2", title: "Title 2", description: "Description 2", columnId: "c2" },{ id: "r3", title: "Title 3", description: "Description 3",columnId: "c3" }]}}` or `{{queries.abc.data}}`. |
| Card width | Set the width of the card. | This property expects a numerical value. By default, the value is set to `{{302}}`. |
| Card height | Set the height of the card. | This property expects a numerical value. By default, the value is set to `{{100}}`. |
| Enable adding card | This property allows you to show or hide the **+ Add Card** button on the Kanban. | By default its enabled, you can programmatically set value to `{{true}}` or `{{false}}` to enable/disable button by clicking on the **fx** next to it. |
| Enable card deletion zone | This property allows you to show or hide the card deletion zone at the bottom of the Kanban. Drag a card into it to delete the card. | By default its enabled, you can programmatically set value to `{{true}}` or `{{false}}` to enable/disable button by clicking on the **fx** next to it. |
| Delete zone label | Sets the text shown in the card deletion zone. Visible only when **Enable card deletion zone** is enabled. | String. Default: `Drop here to delete`. |

### Card Details Modal

Clicking a card opens a modal that shows the card's details. Configure it in the **Card details modal** section.

| <div style={{ width:"100px"}}> Properties </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :----------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Open modal on card click | Opens the card details modal when a card is clicked. When disabled, clicking a card doesn't open the modal, update `lastSelectedCard`, or trigger the **Card selected** event. | Enabled by default. Toggle or set `{{true}}`/`{{false}}` via **fx**. |
| Modal size | Sets the width of the card details modal. | Select **small**, **medium** (default), **large** or **fullscreen**. |
| Height | Sets the height of the card details modal in pixels. Not applied when **Modal size** is **fullscreen**. | Numeric value. Default: `400`. |

## Events

To add an event, click on the component handle to open the component properties on the right sidebar. Go to the **Events** section and click on **Add handler**.

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On update | On update event is triggered whenever the card data (id, title, description, or columnID) is updated using the component specific actions. |
| On add card click | This event is triggered whenever the **Add card** button on the Kanban is clicked. |
| Card removed | This event is triggered whenever the card is **deleted** from the Kanban by dragging it into the bottom delete box or using component specific action. |
| Card added | This event is triggered whenever a card is **added** on the Kanban using the component specific action. |
| Card moved | This event is triggered whenever the card's position is changed on the Kanban or using the component specific action. |
| Card selected | This event is triggered whenever a card is clicked to open the modal. It's only triggered when **Open modal on card click** is enabled. |

Just like any other event on ToolJet, you can set multiple handlers for any of the above mentioned events.

:::info
Check [Action Reference](/docs/actions/run-query) docs to get the detailed information about all the **Actions**.

Check the **[Component Specific Action](#component-specific-actions-csa)** available for Kanban.
:::

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| updatedCardData | The `updatedCardData` variable holds the latest values of all the cards in the Kanban. It's set from **Card data** and updated whenever a card is moved, added, deleted, or updated. | Get the values using `{{components.kanban1.updatedCardData}}`. |
| lastAddedCard | The variable `lastAddedCard` holds the values of the last added card. It holds the following data - `id`, `title`, `description` and `columnId` of the last added card. | Get the values using `{{components.kanban1.lastAddedCard.title}}`. |
| lastRemovedCard | The variable `lastRemovedCard` holds the properties of the card that has been recently deleted from the Kanban. It holds the following data - `id`, `title`, `description` and `columnId` of the recently deleted card. | Get the values using `{{components.kanban1.lastRemovedCard.title}}`. |
| lastCardMovement | The variable `lastCardMovement` holds the properties of the card that has been recently moved from its original position. It holds the following data - `originColumnId`, `destinationColumnId`, `originCardIndex`, `destinationIndex` and an object `cardDetails` which includes `id`, `title`, `description` and `columnId` of the moved card. With `moveCard()`, `destinationIndex` is `0` because the card is placed at the top of the column. | Get the values using `{{components.kanban1.lastCardMovement.cardDetails.title}}` or `{{components.kanban1.lastCardMovement.destinationIndex}}`. |
| lastSelectedCard | The variable `lastSelectedCard` holds the `id`, `title`, `columnId`, and `description` of the last selected(clicked to view) card on the Kanban. | Get the values using `{{components.kanban1.lastSelectedCard.columnId}}`. |
| lastUpdatedCard | The variable `lastUpdatedCard` holds the `id`, `title`, `description`, and `columnId` of the last updated card(using component specific action). | Get the values using `{{components.kanban1.lastUpdatedCard.columnId}}`. |
| lastCardUpdate | The variable `lastCardUpdate` holds the old and new values of the property that has been changed in the card(using component specific action). | Get the values using `{{components.kanban1.lastCardUpdate[0].title.oldValue}}`. |

## Component Specific Actions (CSA)

Following actions of Kanban component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| updateCardData | Update the card data of Kanban component via a component-specific action within any event handler. | Employ a RunJS query to execute component-specific actions such as `components.kanban1.updateCardData('c1', {title: 'New Title'})`. |
| moveCard | Move a card from one column to other column on the kanban via a component-specific action within any event handler. | Employ a RunJS query to execute component-specific actions such as `await components.kanban1.moveCard('card id', 'column id')` ex: `await components.kanban1.moveCard('c1', 'r2')`. |
| addCard | Add a card onto the kanban via a component-specific action within any event handler. Pass a card object with an `id` and a `columnId` that exists. | Employ a RunJS query to execute component-specific actions such as `await components.kanban1.addCard({ id: 'c11', title: 'Title 11', description: 'Description 11', columnId: 'r3' })`. |
| deleteCard | Delete a card from the kanban via a component-specific action within any event handler. | Employ a RunJS query to execute component-specific actions such as `await components.kanban1.deleteCard('card id')` ex: `await components.kanban1.deleteCard('c2')`. | 

## General

### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value as **Plain text**, **Markdown**, or **HTML** by selecting the desired format from the toggle above the field. Now hovering over the component will display the tooltip.

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| Disable | If enabled or set to `{{true}}` the component will be locked and becomes non-functional. By default, it's set to `{{false}}`. |
| Visibility | This is to control the visibility of the component. If `{{false}}`/disabled the component will not visible after the app is deployed. By default, it's enabled (set to `{{true}}`). |
| Accent color | Sets the accent color used for the column titles and the **+ Add Card** button. Enter a Hex color code or choose a color from the color picker. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::
