---
id: action-button
title: Action Buttons
---

In ToolJet, **Action Buttons** can be used in **Table** component. These buttons' can be positioned on the either side of the Table final column. The appearance can be customized, and specific actions can be defined for when they are clicked using the **On click** action. Upon clicking an action button, the **selectedRow** exposed variable of the Table is updated to reflect the data of the selected row.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/action-v3.png" alt="ToolJet - Component Reference - Actions" />

Below are the button text properties that you can set. 

| Property | Description |
| :------- | :----------- |
| Button text | Sets the text that you want to be displayed on the action button. |
| Button position | Sets the button position to left or right. |
| Background color | Sets the background color of the action button. |
| Text color | Sets the color of button-text of the action button. |
| Disable Action Button | Toggle on to disable the action button. You can programmatically set its value by clicking on the **fx** button next to it, if set to `{{true}}`, the action button will be disabled and becomes non-functional. By default, its value is set to `{{false}}`. |
| New event handler | The **New event handler** button lets you create an event handler to define behavior for action buttons based on the `On click` action. |

## Using Action Button to Delete a Row

This example explains how a row can be deleted in a **Table** component using **Action Button**.

1. In Table properties, click on **+ New action button** to create an action button.
2. Customize the button according to the needs by giving Button text, select the button position and define background and text color.
3. Now click on **+ New event handler**.
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/action-button-eh.png" alt="ToolJet - Component Reference - Actions" />
4. Configure the event handler as follow:
    - Event: **On click**
    - Action: **Run Query**
    - Query: **deleteRow** *(Select the query to delete the row.)*
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/action-button-query.png" alt="ToolJet - Component Reference - Actions" />

By this configuration, whenever the button is clicked the selected row will be deleted.