---
id: datepicker
title: Datepicker
---
# Datepicker

The Datepicker widget allows users to select a single value for date and time from a pre-determined set.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Date range picker](/img/widgets/datepicker/datepicker.png)

</div>

## Events
### Event: On select

On select event is triggered when an date is selected.

## Properties

### Default value

This value acts as placeholder for the date picker widget, if any value is not provided then the default value will be used from the picker. The default value needs to a `String` with respect to the `format` field. Ex: If format is set to `MM/YYYY` then provide default value as `04/2022`.

### Disabled dates

We can give disabled dates property which will make specific dates disabled and cannot be selected. The default value needs to a an array of`Strings`.

### Format

The format of the date selected by the date picker. Default date format is **DD/MM/YYYY**. Date format should be followed as ISO 8601 as mentioned in the [moment documentation](https://momentjs.com/docs/). This field requires a `String` input. Ex: `DD/MM`, `MM/YYYY`, `YY/MM`, `DD/MM/YYYY` etc.

### Enable time selection?

Allows to select time if enabled. Time selection is disabled by default. This field requires a boolean value: `{{true}}` or `{{false}}`.

### Enable date selection?

Allows to select date if enabled. Date selection is enabled by default. This field requires a boolean value: `{{true}}` or `{{false}}`.

## Validation

### Custom Validation

Add a validation for the date input in the widget using the ternary operator.
## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Visibility

This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`.

### Disable

This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

### Border Radius

Use this property to modify the border radius of the date-picker. The field expects only numerical value from `1` to `100`, default is `0`. 

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::