---
id: action-button
title: Action Buttons
---

## Action Buttons

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/table/action-v2.png" alt="ToolJet - Component Reference - Actions" />
</div>

Action buttons are positioned in the Table's final column. These buttons' appearance can be customized, and specific actions can be defined for when they are clicked using the `On click` action. Upon clicking an action button, the `selectedRow` exposed variable of the Table is updated to reflect the data of the selected row.

Below are the button text properties that you can set. 

| Property | Description |
| :------- | :----------- |
| Button text | Sets the text that you want to be displayed on the action button. |
| Button position | Sets the button position to left or right. |
| Background color | Sets the background color of the action button. |
| Text color | Sets the color of button-text of the action button. |
| Disable Action Button | Toggle on to disable the action button. You can programmatically set its value by clicking on the **fx** button next to it, if set to `{{true}}`, the action button will be disabled and becomes non-functional. By default, its value is set to `{{false}}`. |
| New event handler | The **New event handler** button lets you create an event handler to define behavior for action buttons based on the `On click` action. |

