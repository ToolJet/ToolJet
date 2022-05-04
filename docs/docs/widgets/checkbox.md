---
id: checkbox
title: Checkbox
---
# Checkbox

Checkbox widget can be used for allowing the users to make a binary choice, e.g,. unselected or selected.

:::info
The checkbox widget consists of a single checkbox input.
:::

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Checkbox](/img/widgets/checkbox/checkbox.gif)

</div>

## Properties

### Label

The text is to be used as the label for the checkbox. This field expects a `String` input.

### Events

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Checkbox](/img/widgets/checkbox/events.png)

</div>

:::info
Check [Action Reference](/docs/actions/show-alert) docs to get the detailed information about all the **Actions**.
:::
#### On check

On check event is triggered when checkbox input is checked.
#### On uncheck

On uncheck event is triggered when checkbox input is unchecked.

### Layout

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Checkbox](/img/widgets/checkbox/layout.png)

</div>

#### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
#### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Checkbox](/img/widgets/checkbox/styles.png)

</div>

### Text color

Change the color of the Text in checkbox by entering the `Hex color code` or choosing a color of your choice from the color-picker. 

### Checkbox color

You can change the color of the checkbox by entering the `Hex color code` or choosing a color of your choice from the color-picker.

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::