---
id: action-button
title: Action Buttons
---

In ToolJet, **Action Buttons** are interactive and customisable elements that trigger specific functions or events when clicked. They enhance user experience by enabling dynamic interactions, facilitating data manipulation, and improving user engagement within applications. \
In the **Table** component, **Action Buttons** can execute queries to delete or update rows.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/action-buttons/action-button.png" alt="Action Buttons" />

## Using Action Button to Delete a Row

This example explains how a row can be deleted in a **Table** component using **Action Button**.

1. In Table properties, click on **+ New action button** to create an action button.
2. Customize the button as needed by setting the button text, selecting the button position, and defining the background and text colors.
3. Now click on **+ New event handler**.
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/action-buttons/delete-button-event.png" alt="Action Button Event Handler" />
4. Configure the event handler as follows:
    - Event: **On click**
    - Action: **Run Query**
    - Query: **deleteRow** *(Select the query to delete the row.)*
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/action-buttons/delete-row-query.png" alt="Action Button Query" />

By this configuration, whenever the button is clicked the selected row will be deleted.

## Using Action Button to Update a Row

This example explains how a row can be updated in a **Table** component using **Action Button**.

1. Go to the Table properties and click on **+ New action button** to create an action button.
2. Customize the button with the desired text (e.g., Update), position the button on the left or right side, and define the background and text colors as needed.
3. Click on **+ New event handler** for the Action Button.
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/action-buttons/update-button-event.png" alt="Action Button Event Handler" />

4. Configure the event handler as follows:
    - Event: **On click**
    - Action: **Run Query**
    - Query: **updateRow** *(Select the query to update the row.)*


<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/action-buttons/update-row-query.png" alt="Action Button Query" />

By this configuration, whenever the button is clicked the selected row will be updated.

## Properties

Below are the action button properties that can be configured.

| Property | Description |
| :------- | :----------- |
| Button text | Sets the text to be displayed on the action button. |
| Button position | Sets the button position to left or right. |
| Background color | Sets the background color of the action button. |
| Text color | Sets the color of button-text of the action button. |
| Disable Action Button | When set to **true** the action button will be disabled and become non-functional. You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| New event handler | The **New event handler** button lets you create an event handler to define behavior for action buttons based on the **On click** action. |
