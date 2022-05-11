---
id: number-input
title: Number Input
---
# Number Input

Number Input widget lets users enter and change numbers.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Number Input](/img/widgets/number-input/number.png)

</div>

:::tip
Numbers can be changed by using the arrow keys.
:::

## Properties

### Default value

A predefined value that can be fetched from the number input widget if no changes are made in widget.

### Placeholder
It specifies a hint that describes the expected value. This field accepts any numerical value.

### Maximum value

It specifies the maximum value the number input can go to. This field accepts any numerical value.

### Minimum value

It specifies the minimum value the number input can go to. This field accepts any numerical value.

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Border radius

Add a border radius to the number input widget using this property. It accepts any numerical value from `0` to `100`.

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::