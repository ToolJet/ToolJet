---
id: color-picker
title: Color Picker
---

**Color Picker** component is used to select the desired color from the color picker.

<div style={{paddingTop:'24px'}}>

## Properties

### Default color

The data needs to be a valid hex color.

- One can change default color either from color picker or using **fx** (need to provide only respective hex value).

**Example:**

```json
Valid color : #000000 or #000
Invalid Color : #0000, "black" , rgb(0,0,0) ,
```

</div>

<div style={{paddingTop:'24px'}}>

## Events

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
|:----------- |:----------- |
| On change | Triggers whenever the color is changed on the color-picker.|

</div>

<div style={{paddingTop:'24px'}}>

## Component Specific Actions (CSA)

The following actions of the component can be controlled using component specific actions(CSA):

| <div style={{ width:"100px"}}> Actions  </div>   | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:----------- |
| setColor() | Sets a color on the color component. | Employ a RunJS query (for e.g., `await components.colorpicker1.setColor('#64A07A')`) or trigger it using an event. |

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{ width:"135px"}}> How To Access </div> |
|:----------- |:----------- |:---------- |
| selectedColorHex | Gets updated with HEX color code whenever a user selects a color from the color picker.| Accessible dynamically with JS (for e.g., `{{components.colorpicker1.selectedColorHex}}`).|
| selectedColorRGB | Gets updated with RGB color code whenever a user selects a color from the color picker. | Accessible dynamically with JS (for e.g., `{{components.colorpicker1.selectedColorRGB}}`).|
| selectedColorRGBA | Gets updated with RGBA color code whenever a user selects a color from the color picker.| Accessible dynamically with JS (for e.g., `{{components.colorpicker1.selectedColorRGBA}}`).|

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value  </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Makes the component visible in desktop view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile | Makes the component visible in mobile view. | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

</div>

----

<div style={{paddingTop:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description    </div>                                                                                                                                                                                                                                          | <div style={{ width:"135px"}}> Expected Value </div> |
|:---------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |:---------- |
| Visibility | Toggle on or off to control the visibility of the component.| Programmatically change its value by clicking on the **fx** button next to it. If `{{false}}` the component will not visible after the app is deployed. By default, it's set to `{{true}}`. |

</div>

<div style={{paddingTop:'24px'}}>

## Actions

| <div style={{ width:"100px"}}> Action  </div>    | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Properties </div> |
|:----------- |:----------- |:------------------ |
| setColor | Set the  color. | `color` eg - `#ffffff` |

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::

**Example: Selecting/changing color from the color picker and getting respective hex, rgb and rgba value of selected color**
- Let's start by creating a new app and then dragging the Color Picker component onto the canvas.
- Click on the Color Picker component, a picker pop-up will appear, one can select desired color from the picker.
- In order to close the appeared picker pop-up, one need's to move away mouse from the picker pop-up and picker pop-up will fade away.
- In the Inspector, inside component, look for colorpicker, where one can get respective hex, rgb and rgba color.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/color-picker/colorpickerinspector-v2.png" alt="ToolJet - Component Reference - Color Picker" />

</div>

</div>
