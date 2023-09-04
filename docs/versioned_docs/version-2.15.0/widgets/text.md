---
id: text
title: Text
---
# Text

Text widget can be used to display text.

:::info
Users cannot enter and edit text.
::: 

## How To Use Text Widget

<iframe height="500" src="https://www.youtube.com/embed/mcjYKw2VeAI" title="Text Widget" frameborder="0" allowfullscreen width="100%"></iframe>

## Properties

### Text

This property sets the content/text inside the Text widget. Refer your query data with dynamic variables `{{queries.datasource.data.text}}` or populate it with sample values `Text goes here !`.

### Show loading state

Toggle `on` or `off` to show or hide the loading state. You can also click on the `Fx` next to it to set the value `{{true}}` and `{{false}}` dynamically. Shows a loading status if the value is `true`. This property is often used with the `isLoading` property of queries so that the table shows a spinner while the query is being run. Default value is `false`.

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Text" />

</div>

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

| Style      | Description |
| ----------- | ----------- | 
| Font Weight | You can change the font weight of the text in following ways: **normal (default), bold, lighter, bolder** |
| Text Decoration | You can change the text decoration in following ways : **none(default), overline, line-through, underline, overline underline** |
| Text Transformation | You can transform the text in following ways: **none (default), uppercase, lowercase, capitalize** |
| Font Style | You can change the font style in following ways: **normal(default), italic, oblique** |
| Line Height | You can change the line height by providing number as input (example - 1.5) |
| Text Indent | You can change the text indent by providing the number as input (example - 10) |
| Letter Spacing | You can change the letter spacing by providing the number as input  (example - 2) |
| Word Spacing  | You can change the letter spacing by providing the number as input  (example - 2) |
| Font Variant | You can change the font variant of the text in the following ways: **normal (default), small-caps, initial, inherit** |
| Text Size | By default, the text size is set to 14. You can enter any value from 1-100 to set custom text size. |
| Background Color | You can change the background color of the text component by entering the Hex color code or choosing a color of your choice from the color picker. |
| Text Color |  You can change the color of the text by entering the Hex color code or choosing a color of your choice from the color picker. |
| Align Text | You can align the text inside the widget in following ways: left, right, center, justified |
| Visibility | This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`. |
| Disable | This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`. |


:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::


## Exposed Variables

| Variables    | Description |
| ----------- | ----------- |
| text | This variable gets updated with HEX color code whenever a user selects a color from the color picker. You can access the value dynamically using JS: `{{components.colorpicker1.selectedColorHex}}`|

## Component specific actions (CSA)

Following actions of color picker component can be controlled using the component specific actions(CSA):

| Actions     | Description |
| ----------- | ----------- |
| visibility | Set a visibility of the text via a component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.text1.visibility(false)` |
| setText | Set a text value on the text component via a component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as `await components.text1.setText('this is a text')` |
