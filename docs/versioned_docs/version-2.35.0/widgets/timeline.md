---
id: timeline
title: Timeline
---
# Timeline

The Timeline component can be used to do a visual representation of a sequence of events.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Properties

### Timeline data

**Data requirements:** The data needs to be an array of objects and each object should have `title`, `subTitle`, `iconBackgroundColor` and `date` keys. The `iconBackgroundColor` can be a hex color code or in an RGBA format.

**Example with hex color code:**
```json
[ 
    { "title": "Product Launched", "subTitle": "First version of our product released to public", "date": "20/10/2021", "iconBackgroundColor": "#4d72fa"},
    { "title": "First Signup", "subTitle": "Congratulations! We got our first signup", "date": "22/10/2021", "iconBackgroundColor": "#4d72fa"}, 
    { "title": "First Payment", "subTitle": "Hurray! We got our first payment", "date": "01/11/2021", "iconBackgroundColor": "#4d72fa"} 
]
```

**Example with RGBA:**
```json
[ 
    { "title": "Product Launched", "subTitle": "First version of our product released to public", "date": "20/10/2021", "iconBackgroundColor": "rgba(240,17,17,0.5)"},
    { "title": "First Signup", "subTitle": "Congratulations! We got our first signup", "date": "22/10/2021", "iconBackgroundColor": "rgba(60, 179, 113,0.5)"}, 
    { "title": "First Payment", "subTitle": "Hurray! We got our first payment", "date": "01/11/2021", "iconBackgroundColor": "rgba(60, 179, 113,0.5)"} 
]
```

### Hide date

Hide date can be used to hide the date time of the timeline component.

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

A Tooltip is often used to specify extra information when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

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

| <div style={{ width:"100px"}}> Style </div>     | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"100px"}}> How To Access </div> |
|:----------- |:----------- |:--------|
| Visibility | Toggle on or off to control the visibility of the component. | Programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the component will not visible after the app is deployed. By default, it's set to `{{true}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

</div>