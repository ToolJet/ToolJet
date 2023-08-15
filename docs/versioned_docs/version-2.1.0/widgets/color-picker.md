---
id: color-picker
title: Color Picker
---

# Color Picker

Color Picker widget is used to select the desired color from the color picker. This component can be used to select the color and get respective hex, rgb and rgba value of selected color.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/color-picker/picker1.png" alt="ToolJet - Widget Reference - Color Picker" />

</div>

## Properties

| Property | Description | Type | Default value |
| --- | --- | --- | --- |
| Default Color | Default color in the color picker. Expects a respective hex value. | `string` | `#000000` |

**Example:**

```json
Valid color : #000000 or #000
Invalid Color : #0000, "black" , rgb(0,0,0) ,
```

## Events

Events are used to trigger some actions when the user interacts with the widget. To add an event, click on the `+ Add handler` on the right sidebar.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/color-picker/events1.png" alt="ToolJet - Widget Reference - Color Picker" />

</div>

| Event | Description |
| --- | --- |
| On change | On change event is triggered when the color is changed on the color-picker. |

## General
#### Tooltip

A Tooltip is often used to specify the extra information when the user hovers the mouse pointer over the component. Once a value is set for Tooltip, hovering over the element will display the specified string as the tooltip text.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/color-picker/tooltip.png" alt="ToolJet - Widget Reference - Color Picker" width='300'/>

</div>

## Layout

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/color-picker/layout1.png" alt="ToolJet - Widget Reference - Color Picker" width='300'/>

</div>

| Layout | description | Expected value |
| ------ | ----------- | -------------- |
| Show on desktop | Toggle on or off to control the visibility of the widget on desktop. By default, it's set to `{{true}}`. | `boolean` ex: {{true}} or {{false}} |
| Show on mobile | Toggle on or off to control the visibility of the widget on mobile. By default, it's set to `{{false}}`. | `boolean` ex: {{true}} or {{false}} |

## Styles

| Property | Description | Expected value |
| ------ | ----------- | -------------- |
| Visibility | Toggle on or off to control the visibility of the widget. By default, it's set to `{{true}}`. | `boolean` ex: {{true}} or {{false}} |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Example: Selecting/changing color from the color picker and getting respective hex, rgb and rgba value of selected color
- Let's start by creating a new app and then dragging the Color Picker  widget onto the canvas.
- Click on the Color Picker widget, a picker pop-up will appear, one can select desired color from the picker.
- In order to close the appeared picker pop-up, one need's to move away mouse from the picker pop-up and picker pop-up will fade away.
- In the Inspector, inside component, look for colorpicker, where one can get respective hex, rgb and rgba color

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/color-picker/colorpickerinspector.png" alt="ToolJet - Widget Reference - Color Picker" />

</div>