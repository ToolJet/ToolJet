---
id: timeline
title: Timeline
---
# Timeline

Timeline widget can be used to do a visual representation of a sequence of events


<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Timeline](/img/widgets/timeline/timeline.png)

</div>

## Properties

### Timeline data

**Data requirements:** The data needs to be an array of objects and each object should have `title`, `subTitle`, `iconBackgroundColor` and `date` keys.

**Example:**
```json
[ 
    { "title": "Product Launched", "subTitle": "First version of our product released to public", "date": "20/10/2021", "iconBackgroundColor": "#4d72fa"},
    { "title": "First Signup", "subTitle": "Congratulations! We got our first signup", "date": "22/10/2021", "iconBackgroundColor": "#4d72fa"}, 
    { "title": "First Payment", "subTitle": "Hurray! We got our first payment", "date": "01/11/2021", "iconBackgroundColor": "#4d72fa"} 
]
```


### Hide date

Hide date can be used to hide the date time or Left Hand Side of the timeline widget

## Layout

| Layout          | description                               | Expected value                                                                                              |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Show on desktop | Toggle on or off to display desktop view. | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |
| Show on mobile  | Toggle on or off to display mobile view.  | You can programmatically determining the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}` |

## Styles

| Style      | Description |
| ----------- | ----------- | 
| Visibility | Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not visible after the app is deployed. By default, it's set to `{{true}}`. |

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::
