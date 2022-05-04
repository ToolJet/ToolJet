---
id: textarea
title: Textarea
---
# Textarea

Textarea widgets let users enter and edit just text like [Text Input](/docs/widgets/text-input) widget.

:::tip
Textarea should be preferred over [Text Input](/docs/widgets/text-input) when user input is more than one sentence.
:::

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Text input](/img/widgets/textarea/textarea.png)

</div>

## Properties

### Placeholder

It specifies a hint that describes the expected value. This field expects a `String` value.

### Default value

This property is used for setting the initial value in the textarea on the initial load. This field expects a `String` value.

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Border Radius

Use this property to modify the border radius of the text area widget. The field expects only numerical value from `1` to `100`, default is `0`. 
### Visibility

This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`.
### Disable

This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::