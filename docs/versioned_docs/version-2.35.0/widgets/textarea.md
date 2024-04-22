---
id: textarea
title: Textarea
---
# Textarea

The **Textarea** component allows users to enter text in an input field similar to the [Text Input](/docs/widgets/text-input) component. Textarea is generally preferred when we are expecting an input of multiple sentences. In this document, we'll go through all the configuration options for the **Textarea** component.  

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div>    | <div style={{ width:"100px"}}> Description                   </div>                              | <div style={{ width:"135px"}}> Expected Value </div> |
|:-------------|:------------------------------------------------------------|:------------|
| Default value| Used to set initial value in textarea on load. It is a pre-established value that can be retrieved from the Text area component if no modifications are made to it. | Enter some text as the value (example: "John Doe")|
| Placeholder  | Provides a hint for the expected value. It disappears once the user interacts with the component. | Enter some instructional text as the value (example: "Type name here")   |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

Following actions of the **Textarea** component can be controlled using Component-Specific Actions(CSA):

| <div style={{ width:"100px"}}> Actions  </div>   | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
| :----------- | :----------- |:---------|
| setText | Sets the text on the text area component via a component-specific action within any event handler.|  Employ a RunJS query to execute component-specific actions such as `await components.textarea1.setText('this is a textarea')`. |
| clear | Clears the value from the text area component via a component-specific action within any event handler.| Employ a RunJS query to execute component-specific actions such as `await components.textarea1.clear()`. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables  </div>  | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|: ----------- |: ----------- | :-------------|
| value | This variable holds the value entered in the text area component. | Sccess the value dynamically using JS. For example, `{{components.textarea1.value}}`|

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General

### Tooltip

A **Tooltip** is commonly used to provide additional information about an element. This information becomes visible when the user hovers the mouse pointer over the respective component.

In the input field under **Tooltip**, you can enter some text and the component will show the specified text as a tooltip when it is hovered over.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

--- 

## Styles

| <div style={{ width:"100px"}}> Style  </div>    |  <div style={{ width:"100px"}}> Description </div> |  <div style={{ width:"135px"}}> Expected Value </div> |
|:---------------|:-----------|:---------------|
| Visibility | Controls the visibility of the component. If set to `{{false}}`, the component will not be visible after the app is deployed.| Use the toggle button OR click on `Fx` to pass a boolean value or a logical expression that returns a boolean value i.e. either `{{true}}` or `{{false}}`|
| Disable | Makes the component non-functional when set to true. | Use the toggle button OR click on `Fx` to pass a boolean value or a logical expression that returns a boolean value i.e. either `{{true}}` or `{{false}}`|
| Border radius | Adjusts the roundness of the component's corners.  | Numeric value|

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General

### Box Shadow

The **Box Shadow** property is used to add shadow effects around a component's frame. You can specify the horizontal and vertical offsets(through X and Y sliders), blur and spread radius, and color of the shadow.

</div>