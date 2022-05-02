---
id: date-range-picker
title: Date-range picker
---
# Date-range picker

The date-range picker widget allows users to select a range of dates.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Date range picker](/img/widgets/date-range-picker/date-range.gif)

</div>

## Properties

### Format

The format of the date selected by the date picker. Default date format is **DD/MM/YYYY**. Date format should be followed as ISO 8601 as mentioned in the [moment documentation](https://momentjs.com/docs/).

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Border Radius

Use this property to modify the border radius of the date range picker. The field expects only numerical value from `1` to `100`, default is `0`. 
### Visibility

This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`.
### Disable

This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::