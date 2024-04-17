---
id: iframe
title: Iframe
---
# Iframe

Iframe widget is used to embed another HTML page into the current one and display iframes in your app.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Property </div> |  <div style={{ width:"100px"}}> Description </div> |
|:--------- |:---------|
| URL | Set the **URL** of the page to embed.|

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

There are currently no exposed variables for the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the  mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

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

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Default Value </div> |
|:----------- |:----------- |:------------- |
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. | By default, it's set to `{{true}}`. |
| Disable | This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>