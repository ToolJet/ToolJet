---
id: action-button
title: Action Buttons
---

In ToolJet, **Action Buttons** can be used in **Table** component. These buttons can be positioned on the either side of the Table. The appearance can be customized, and specific actions can be defined for when they are clicked using the **On click** action. Upon clicking an action button, the **selectedRow** exposed variable of the Table is updated to reflect the data of the selected row.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/action-v3.png" alt="Action Buttons" />

Below are the button text properties that can be configured.

| Property | Description |
| :------- | :----------- |
| Button text | Sets the text to be displayed on the action button. |
| Button position | Sets the button position to left or right. |
| Background color | Sets the background color of the action button. |
| Text color | Sets the color of button-text of the action button. |
| Disable Action Button | Toggle on to disable the action button. You can programmatically set its value by clicking the fx button next to it. If set to `{{true}}`, the action button will be disabled and become non-functional. |
| New event handler | The **New event handler** button lets you create an event handler to define behavior for action buttons based on the `On click` action. |

## Using Action Button to Delete a Row

This example explains how a row can be deleted in a **Table** component using **Action Button**.

1. In Table properties, click on **+ New action button** to create an action button.
2. Customize the button as needed by setting the button text, selecting the button position, and defining the background and text colors.
3. Now click on **+ New event handler**.
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/action-button-eh.png" alt="Action Button Event Handler" />
4. Configure the event handler as follows:
    - Event: **On click**
    - Action: **Run Query**
    - Query: **deleteRow** *(Select the query to delete the row.)*
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/action-button-query.png" alt="Action Button Query" />

By this configuration, whenever the button is clicked the selected row will be deleted.

## Using Action Button to Update a Row

This example explains how a row can be updated in a **Table** component using **Action Button**.

1. Create Input Components for Editing Data:\
Drag and drop input components (e.g., Text Input, Dropdown) onto your page and configure them to edit specific table columns.
2. Go to the Table properties and click on **+ New action button** to create a new Action Button.
3. Customize the button with the desired text (e.g., Update) and style it as needed.
4. Click on **+ New event handler** for the Action Button.
5. Configure the event handler as follows:
    - Event: **On click**
    - Action: **Run Query**
    - Query: **updateRow** 
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/update-button-eh.png" alt="Action Button Event Handler" />
6. Create the Update Query:
    - Table Name: Select the table to update.
    - Operation: Select **Update rows**.
    - Filter: Specify the filter to identify the row to update.
    - Columns: Map the input component values to the columns you want to update.
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/widgets/table/update-button-query.png" alt="Action Button Query" />

By this configuration, whenever the button is clicked the selected row will be updated.
