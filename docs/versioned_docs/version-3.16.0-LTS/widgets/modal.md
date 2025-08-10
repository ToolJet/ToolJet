---
id: modal-v2
title: Modal
---

The Modal component allows you to display content in a pop-up overlay, helping you focus user attention on specific tasks or messages without navigating away from the current page. It’s commonly used for forms, confirmations, alerts, or detailed views. You can open or close the modal programmatically, control its visibility based on user interaction, and customize its size, position, and content for a seamless user experience.

:::caution Restricted components
Certain components, namely **Calendar** and **Kanban**, are restricted from being placed within the Modal component.
:::

## Properties

| <div style={{ width:"100px"}}> Property </div>   | <div style={{ width:"100px"}}> Description </div> |  <div style={{ width:"200px"}}> Expected Value </div>  |
|:----------- |:----------- |:-----------|
| Header | Enable or Disable header section in the modal. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Footer | Enable or Disable footer section in the modal. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Width | Select the width for modal component. | Select from dropdown - small, medium, large, fullscreen or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Height | Specifies the height of the modal. | Enter the height in pixel or dynamically configure the value by clicking on **fx** and entering a logical expression.  |

## Events

| Event    | Description   |
|:---------|:--------------|
| On open  | Triggers whenever the modal is opened. |
| On close | Triggers whenever the modal is closed. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"170px"}}> Description </div> | <div style={{width: "200px"}}> RunJS Query </div>|
| :------------ | :---------- | :------------ |
| open  | Open a modal. | `components.modal1.open()` |
| close | Close a modal. | `components.modal1.close()` |
| setDisableTrigger | Disables the modal button. | `components.modal1.setDisableTrigger()` |
| setDisableModal | Disables the modal pop-up. | `components.modal1.setDisableModal()` |
| setVisibility( )| Sets the visibility of the component.  | `components.modal1.setVisibility(false)` |
| setLoading( )   | Sets the loading state of the component.  | `components.modal1.setLoading(true)` |

## Exposed Variables

| Variable | <div style={{ width:"250px"}}> Description </div> | How To Access |
|:--------|:-----------|:------------|
|  show | Indicates if the modal is open. | `{{components.modal1.show}}` |
|  isDisabledModal | Indicates if the modal is disabled. | `{{components.modal1.isDisabledModal}}` |
|  isDisabledTrigger | Indicates if the modal button is disabled. | `{{components.modal1.isDisabledTrigger}}` |
|  isLoading | Indicates if the component is loading. | `{{components.modal1.isLoading}}`|
|  isVisible | Indicates if the component is visible. | `{{components.modal1.isVisible}}`|

## Trigger

| Property | Description |
|----------|-------------|
| Modal trigger visibility | Sets the visibility of modal button. |
| Disable modal trigger | Disables modal button.  |
| Use default trigger button | Choose whether to use the default modal button or not. |
| Trigger button label | Provide label for the modal button. |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress.  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable modal window | Disables the modal pop-up. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Close on escape key | Closes the modal when escape key is pressed. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Close on clicking outside | Closes the modal when clicked outside the modal. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Hide close button | Hides close button from the modal header. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip            | Provides additional information on hover.    | String (e.g., `Enter your password here.` ).                      |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
