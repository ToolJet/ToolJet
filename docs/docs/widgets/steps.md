---
id: steps
title: Steps
---
# Steps

**Steps** helps guide users through a process, one step at a time. It's perfect for things like forms, onboarding, or any task that involves multiple stages. Each step shows users where they are, what they've completed, and what’s next.

This makes complex tasks feel more manageable, giving users a clear sense of progress and direction. You can also add tooltips and status indicators to make the experience even more helpful.

<div style={{paddingTop:'24px'}}>

## Properties

### Steps

This property lets you add and the steps. Every object represents a step.

```json
{{
    [
        { name: 'step 1', tooltip: 'some tooltip', id: 1},
        { name: 'step 2', tooltip: 'some tooltip', id: 2},
        { name: 'step 3', tooltip: 'some tooltip', id: 3},
        { name: 'step 4', tooltip: 'some tooltip', id: 4},
        { name: 'step 5', tooltip: 'some tooltip', id: 5}
    ]
}}
```

### Current step

This property lets you select the current step you want to be highlighted.

### Steps selectable

This property when disabled will disable the selection of steps.

</div>

<div style={{paddingTop:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:------------------|:---------------------|
| On select |  Triggers whenever the user selects any step. |
</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables  </div>  | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div>|
|:----------- |:----------- |:--------------|
| currentStepId | This variable holds the id of the currently selected step on the step component.| Access the value dynamically using JS: `{{components.steps1.currentStepId}}`|

</div>

<div style={{paddingTop:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px'}}>

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on **fx** to set the value `{{true}}` or `{{false}}`. |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on **fx** to set the value `{{true}}` or `{{false}}`. |

</div>

<div style={{paddingTop:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}>  Description </div> |
|:------------ |:-------------|
| Theme | You can change the theme of a component by selecting available themes from the dropdown. |
| Colour | You can change the  color of the component by entering the Hex color code or choosing a color of your choice from the color picker. |
| Text color | You can change the  text color of the component by entering the Hex color code or choosing a color of your choice from the color picker. |
| Visibility | Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the **fx** button next to it. If `{{false}}` the component will not be visible after the app is deployed. By default, it's set to `{{true}}`. |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

</div>
