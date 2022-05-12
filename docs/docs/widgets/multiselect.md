---
id: multiselect
title: Multiselect
---
# Multiselect

Multiselect widget can be used to collect multiple user inputs from a list of options.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Multiselect](/img/widgets/multiselect/multi.gif)

</div>

## Event

### On select

On select event is triggered when an option is selected.

:::info
Check [Action Reference](/docs/actions/show-alert) docs to get the detailed information about all the **Actions**.
:::

## Properties

### Label

The text is to be used as the label for the multiselect widget.

### Default value

The value of the default option. This should always be an array.
### Option values

Values for different items/options in the list of the multiselect.

### Option labels

Labels for different items/options in the list of the multiselect.

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Border radius

Add a border radius to the multiselect using this property. It accepts any numerical value from `0` to `100`.

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::