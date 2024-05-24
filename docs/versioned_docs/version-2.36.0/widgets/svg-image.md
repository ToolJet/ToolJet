---
id: svg-image
title: Svg Image
---
# SVG Image

It is used to render vector images. We can display images, icons, texts using this widget. SVGs are vector images and therefore are usually much smaller in file-size than bitmap-based images.

Developers prefer having SVG **(Scalable Vector Graphics)** files as they are scalable and will render pixel-perfect at any resolution whereas JPEGs, PNGs and GIFs will not. 

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

### SVG data

Enter the SVG data of the image to display it on the widget. 

:::tip
Refer to the resources where SVG files are downloaded for free. You copy-paste the below data in this field to see a new icon being rendered.
:::

```
<svg fill="#000000" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 16 16" width="32px" height="32px"><path d="M 7.5 1 C 3.910156 1 1 3.90625 1 7.488281 C 1 10.355469 2.863281 12.789063 5.445313 13.648438 C 5.769531 13.707031 6 13.375 6 13.125 C 6 12.972656 6.003906 12.789063 6 12.25 C 4.191406 12.640625 3.625 11.375 3.625 11.375 C 3.328125 10.625 2.96875 10.410156 2.96875 10.410156 C 2.378906 10.007813 3.011719 10.019531 3.011719 10.019531 C 3.664063 10.0625 4 10.625 4 10.625 C 4.5 11.5 5.628906 11.414063 6 11.25 C 6 10.851563 6.042969 10.5625 6.152344 10.378906 C 4.109375 10.019531 2.996094 8.839844 3 7.207031 C 3.003906 6.242188 3.335938 5.492188 3.875 4.9375 C 3.640625 4.640625 3.480469 3.625 3.960938 3 C 5.167969 3 5.886719 3.871094 5.886719 3.871094 C 5.886719 3.871094 6.453125 3.625 7.496094 3.625 C 8.542969 3.625 9.105469 3.859375 9.105469 3.859375 C 9.105469 3.859375 9.828125 3 11.035156 3 C 11.515625 3.625 11.355469 4.640625 11.167969 4.917969 C 11.683594 5.460938 12 6.210938 12 7.207031 C 12 8.839844 10.890625 10.019531 8.851563 10.375 C 8.980469 10.570313 9 10.84375 9 11.25 C 9 12.117188 9 12.910156 9 13.125 C 9 13.375 9.226563 13.710938 9.558594 13.648438 C 12.140625 12.785156 14 10.355469 14 7.488281 C 14 3.90625 11.089844 1 7.5 1 Z"/></svg>
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables

There are currently no exposed variables for the component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## General

### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Layout

| <div style={{ width:"100px"}}> Layout </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
|:--------------- |:----------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> Default Value </div> |
|:------------ |:-------------|:--------- |
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. | By default, it's set to `{{true}}`. |

</div>