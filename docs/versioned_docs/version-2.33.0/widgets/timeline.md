---
id: timeline
title: Timeline
---
# Timeline

The Timeline component can be used to do a visual representation of a sequence of events.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/timeline/timeline.png" alt="ToolJet - Widget Reference - Timeline" />
</div>

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

## General
### Tooltip

A Tooltip is often used to specify extra information when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Component Reference - Timeline" />

</div>

## Layout

| Layout| description| Expected value|
| ----- | ---------  | ------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

## Styles

| Style      | Description |
| ----------- | ----------- | 
| Visibility | Toggle on or off to control the visibility of the component. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the component will not visible after the app is deployed. By default, it's set to `{{true}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::


## Exposed variables

There are currently no exposed variables for the component.

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.
