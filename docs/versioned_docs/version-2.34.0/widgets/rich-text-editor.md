---
id: rich-text-editor
title: Text Editor
---
# Text Editor

Rich Text Editor can be used to enter and edit the text in HTML format.
It should be preferred for blog posts, forum posts or notes sections. The text is to be used as the label for the radio button.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

| <div style={{ width:"100px"}}> Placeholder </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| Placeholder | It specifies a hint that describes the expected value. |
| Default Value | The default value that the widget will hold when the app is loaded. |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables  </div>  | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:--------- |
| value | This variable holds the value whenever a user enters a value in the rich text editor component.| You can access the value dynamically using JS: `{{components.richtexteditor1.value}}`|

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

| <div style={{ width:"135px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| Show on desktop | Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on Fx to set the value `{{true}}` or `{{false}}` |
| Show on mobile | Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on Fx to set the value `{{true}}` or `{{false}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style  </div>    |  <div style={{ width:"100px"}}> Description </div> |  <div style={{ width:"100px"}}> Default Value </div> |
|:---------------|:-----------|:---------------|
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. | By default, it's set to `{{true}}`. |
| Disable | This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. | By default, its value is set to `{{false}}`. |

</div>