---
id: textarea
title: Textarea
---
# Textarea

Textarea widgets let users enter and edit just text like [Text Input](/docs/widgets/text-input) widget.

:::tip
Textarea should be preferred over [Text Input](/docs/widgets/text-input) when user input is more than one sentence.
:::

## How To Use Textarea Widget

<iframe height="500" src="https://www.youtube.com/embed/ja66x6DeZxk" title="Textarea Widget" frameborder="0" allowfullscreen width="100%"></iframe>

## Properties

### Default value

This property is used for setting the initial value in the textarea on the initial load. This field expects a `String` value.

### Placeholder

It specifies a hint that describes the expected value. This field expects a `String` value.

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Text area" />

</div>

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Border Radius

Use this property to modify the border radius of the text area widget. The field expects only numerical value from `1` to `100`, default is `0`. 
### Visibility

This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`.
### Disable

This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

## Exposed Variables

| Variables    | Description |
| ----------- | ----------- |
| value | This variable holds the value of the text area component. You can access the value dynamically using JS: `{{components.textarea1.value}}`|

## Component specific actions (CSA)

Following actions of color picker component can be controlled using the component specific actions(CSA):

| Actions     | Description |
| ----------- | ----------- |
| setText | Set the text on the text area component via a component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.textarea1.setText('this is a text')` |
| clear | clear the value from the text area component via a component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.text1.clear()` |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::