---
id: icon
title: Icon 
---

An Icon widget can be used to add icons(sourced from icon library). It supports events like on hover and on click.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

|  <div style={{ width:"100px"}}> Properties </div> |  <div style={{ width:"100px"}}> Description </div> |  <div style={{ width:"135px"}}> Expected Value </div> |
|:----------- |:----------- |:-------------- |
| Icon | Use this to choose an icon form the list of available icons | You can also use the search bar in it to look for the icons | 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Events

To add an event, click on the icon widget's configuration handle to open the widget properties on the components drawer on the right. Go to the **Events** section and click on **+ Add handler**.

The Icon widget supports the following events:

|  <div style={{ width:"100px"}}> Event </div> |  <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On hover      | This event is triggered when the cursor is hovered over the icon|
| On click      | This event is triggered when the icon is clicked |

Just like any other event on ToolJet, you can set multiple handlers for any of the above-mentioned events.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

Following actions of the component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Actions  </div>   | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:--------- |
| setVisibility | You can toggle the visibility of the icon component via a component-specific action within any event handler. | Employ a RunJS query to execute component-specific actions such as `await components.icon1.setVisibility(false)` |
| click | You can trigger the click action on icon component via a component-specific action within any event handler. | Employ a RunJS query to execute component-specific actions such as `await components.icon1.click()` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

There are currently no exposed variables for the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General

<b>Tooltip:</b> Set a tooltip text to specify the information when the user moves the mouse pointer over the widget.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:----------- |:----------- |:------------- |
| Icon color |  You can change the color of the icon widget by entering the Hex color code or choosing a color of your choice from the color picker. |
| Visibility | This is to control the visibility of the widget. | If `{{false}}` the widget will not visible after the app is deployed. | It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`. |
| Box shadow | This property adds a shadow to the widget. | You can use different values for box shadow property like offsets, blur, spread, and the color code. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>