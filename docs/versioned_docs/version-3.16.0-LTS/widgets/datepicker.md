---
id: datepicker
title: Date Picker
---

The **Date Picker** component allows users to select a single value for date and time from a pre-determined set.

:::info
This is a legacy component. Check out the new version of the date picker component [here](/docs/widgets/date-picker-v2).
:::

## Properties

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> |
| :--------------------------------------------- | :------------------------------------------------ |
| Default value | This value acts as placeholder for the date picker component, if any value is not provided then the default value will be used from the picker. The default value needs to be a `String` with respect to the `format` field. Ex: If format is set to `MM/YYYY` then provide default value as `04/2022`. |
| Format | This value acts as placeholder for the date picker component, if any value is not provided then the default value will be used from the picker. The default value needs to be a `String` with respect to the `format` field. Ex: If format is set to `MM/YYYY` then provide default value as `04/2022`. |
| Enable time selection? | Toggle on or off to enable the time selection. You can programmatically determine the value by clicking on **fx** to set the value `{{true}}` or `{{false}}`. |
| Enable date selection? | Toggle on or off to enable the date selection. You can programmatically determine the value by clicking on **fx** to set the value `{{true}}` or `{{false}}`. |
| Disabled dates | We can give disabled dates property which will make specific dates disabled and cannot be selected. The default value needs to be an array of `Strings`. |

Example for disabling the 9th of January:

```js
{
  {
    ["09-01"];
  }
}
```

Now user won't be able to select the mentioned date since it will be disabled.

## Events

To add an event to a date-picker component, click on the component handle to open the component properties on the right sidebar. Go to the **Events** section and click on **+ Add handler**.

| <div style={{ width:"100px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div> |
| :------------------------------------------ | :------------------------------------------------ |
| On select                                   | Triggers whenever the user selects a date.        |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get the detailed information about all the **Actions**.
:::

## Component Specific Actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.

## Exposed Variables

| <div style={{ width:"100px"}}> Variables </div> | <div style={{ width:"135px"}}> Description </div>     | <div style={{ width:"135px"}}> How To Access </div>                           |
| :---------------------------------------------- | :---------------------------------------------------- | :---------------------------------------------------------------------------- |
| value                                           | Holds the value entered by the user in the component. | Accessible dynamically with JS (for e.g.,`{{components.datepicker1.value}}`). |

## Validation

### Custom Validation

Add a validation for the date input in the component using the ternary operator.

Example of validation for selecting dates that are after the current date:

```js
{
  {
    moment(components.datepicker1.value, "DD/MM/YYYY").isAfter(moment())
      ? true
      : "Date should be after today";
  }
}
```

## General

### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the component.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the component will display the string as the tooltip.

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Expected Value </div> |
| :--------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------- |
| Show on desktop                                | Makes the component visible in desktop view.      | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile                                 | Makes the component visible in mobile view.       | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Styles

| <div style={{ width:"100px"}}> Style </div> | <div style={{ width:"100px"}}> Description </div> | <div style={{ width:"135px"}}> Default Value </div> |
| :------------------------------------------ | :------------------------------------------------ | :-------------------------------------------------- |
| Visibility | This is to control the visibility of the component. If `{{false}}` the component will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. | By default, it's set to `{{true}}`. |
| Disable | This property only accepts boolean values. If set to `{{true}}`, the component will be locked and becomes non-functional | By default, its value is set to `{{false}}`. |
| Border radius | Use this property to modify the border radius of the date-picker. The field expects only numerical value from `1` to `100` | By default, its value is set to `0`. |

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::

:::info
Any property having **fx** button next to its field can be **programmatically configured**.
:::
