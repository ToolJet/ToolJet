---
id: star-rating
title: Star rating
---
# Star rating

Star rating widget can be used to display as well as input ratings. The widget supports half stars, and the number of stars can be set too.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/star/star-rating.png" alt="ToolJet - Widget Reference - Star rating" />

</div>

## Events

### On Change

This event is triggered when a star is clicked.

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get the detailed information about all the **Actions**.
:::

## Properties

### Label

The text to be used as the label for the star rating. This field expects a `String` value.

### Number of stars

Initial number of stars in the list on initial load. `default: 5`. This field expects an integer value.

### Default no of selected stars

This property specifies the default count of stars that are selected on the initial load. `default: 5` (integer). This field expects an integer value.

### Enable half star

Toggle `on` to allow selection of half stars. `default: false` (bool). Click on `Fx` to programmatically define the value `{{true}}` or `{{false}}`.

### Tooltips

This is used for displaying informative tooltips on each star, and it is mapped to the index of the star. `default: []` (array of strings ). Ex: `{{["bad", "okay", "good", "best"]}}`

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Star rating" />

</div>

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Star Color

Display color of the star. `default: #ffb400` (color hex). Change color by providing `Hex color code` or choosing one from the picker.

### Label color

Change the color of label in widget by providing `Hex color code` or choosing one from the picker.

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

## Exposed Variables

| Variables    | Description |
| ----------- | ----------- |
| value | This variable holds the value whenever a rating is added on the component. The variable holds a numerical value. You can access the value dynamically using JS: `{{components.colorpicker1.selectedColorHex}}`|

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.
