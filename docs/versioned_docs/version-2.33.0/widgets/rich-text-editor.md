---
id: rich-text-editor
title: Text Editor
---
# Text Editor

Rich Text Editor can be used to enter and edit the text in HTML format.
It should be preferred for blog posts, forum posts or notes sections. The text is to be used as the label for the radio button.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/richtexteditor/richtexteditor.png" alt="ToolJet - Widget Reference - Rich Text Editor" />

</div>

## Properties

### Placeholder

It specifies a hint that describes the expected value.

### Default Value

The default value that the widget will hold when the app is loaded.

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference -Rich Text Editor" />

</div>

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

## Exposed Variables

| Variables    | Description |
| ----------- | ----------- |
| value | This variable holds the value whenever a user enters a value in the rich text editor component. You can access the value dynamically using JS: `{{components.richtexteditor1.value}}`|

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.
