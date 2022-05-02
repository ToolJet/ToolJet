---
id: rich-text-editor
title: Rich Text Editor
---
# Rich Text Editor

Rich Text Editor can be used to enter and edit the text in HTML format.
It should be preferred for blog posts, forum posts or notes sections. The text is to be used as the label for the radio button.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Rich Text Editor](/img/widgets/richtexteditor/richtexteditor.png)

</div>

## Properties

### Placeholder

It specifies a hint that describes the expected value.

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.
