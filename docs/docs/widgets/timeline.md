---
id: timeline
title: Timeline
---

# Timeline

The **Timeline** component provides a visual representation of a sequence of events. It's useful for displaying historical data, project milestones, or any chronological information in a clear and engaging format.

<div style={{paddingTop:'24px'}}>

## Properties

### Timeline data

**Data requirements:** The data should be an array of objects. Each object must have `title`, `subTitle`, `iconBackgroundColor`, and `date` keys. The `iconBackgroundColor` can be a hex color code or in an RGBA format.

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

Toggle this option to hide the date/time information in the Timeline component.

</div>

<div style={{paddingTop:'24px'}}>

## Component-Specific Actions (CSA)

There are currently no Component-Specific Actions implemented for the Timeline component.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed Variables

There are currently no exposed variables for the Timeline component.

</div>

<div style={{paddingTop:'24px'}}>

## General
### Tooltip

A Tooltip provides additional information when users hover over the component. Set the tooltip content under the **General** accordion in the component's properties.

</div>

<div style={{paddingTop:'24px'}}>

## Devices

| Property        | Description                               | Expected Value |
| :-------------- | :---------------------------------------- | :------------- |
| Show on desktop | Controls the component's desktop visibility | Set to `{{true}}` to show on desktop, `{{false}}` to hide |
| Show on mobile  | Controls the component's mobile visibility  | Set to `{{true}}` to show on mobile, `{{false}}` to hide |

</div>

<div style={{paddingTop:'24px'}}>

## Styles

| Property | Description | Configuration Options |
| :------- | :---------- | :-------------------- |
| Visibility | Controls the component's visibility | Toggle on/off or use `{{true}}` / `{{false}}` |
| Box Shadow | Adds a shadow effect around the component | Options: `none` (default), `sm`, `md`, `lg`, `xl`, `2xl` |

:::info
Any property with an `Fx` button next to it can be **programmatically configured**.
:::

</div>