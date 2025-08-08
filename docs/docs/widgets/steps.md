---
id: steps
title: Steps
---

The **Steps** component helps break down complex process into clear, manageable stages. It’s ideal for multi-step forms, onboarding flows, or approval processes, giving users a clear sense of progress and direction. 

## Properties

| Property | Description | 
|:---------|:------------|
| Variant  | Choose what you want to display on the component - Label, Number, Plain. |
| Dynamic Options | Toggle on to add steps dynamically or click on **Add new option** button to add a new step. |
| Current step | Select which step should be selected by default. |

## Events

| Event | Description |
|:-------|:---------------------|
| On select |  Triggers whenever the user selects any step. |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{width: "200px"}}> RunJS Query </div>|
| :------------ | :---------- | :------------ |
| setStepVisible( ) | Set the step visibility. | `components.steps1.setStepVisible` |
| setStepDisable( )| Disables the step. | `components.steps1.setStepDisable` |
| resetSteps( )| Resets the completed steps, takes user to the default step. | `components.steps1.resetSteps` |
| setStep( )| Takes user to step ID, marks all the previous steps as completed.  | `components.steps1.setStep` |
| setVisibility( )| Sets the visibility of the component.                 | `components.steps1.setVisibility(false)` |
| setDisable( )   | Disables the component.                               | `components.steps1.setDisable(true)` |

## Exposed Variables

| <div style={{ width:"100px"}}> Variables  </div>  | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div>|
|:----------- |:----------- |:--------------|
|  currentStepId | Holds the ID of the currently selected step on the step component.| `{{components.steps1.currentStepId}}` |
|  steps| Stores information of all the steps. | `{{components.steps1.steps}}` |
|  isVisible | Indicates if the component is visible. | `{{components.steps1.isVisible}}`|
|  isDisabled  | Indicates if the component is disabled. | `{{components.steps1.isDisabled}}`|


## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Steps selectable | When disabled will disable the selection of steps. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility         | Controls component visibility.       | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable            | Enables or disables the component.    | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Devices

|<div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>|
|:---------- |:----------- |:----------|
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}>  Description </div> | Expected Value |
|:------------ |:-------------|--------------|
| Incompleted accent | Choose color for incomplete accent. | Select from theme or choose from color picker. |
| Incompleted label | Choose color for incomplete label. | Select from theme or choose from color picker. |
| Completed accent | Choose color for completed accent. | Select from theme or choose from color picker. |
| Completed label | Choose color for completed label. | Select from theme or choose from color picker. |
| Current step label | Choose color for current step label. | Select from theme or choose from color picker. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::
