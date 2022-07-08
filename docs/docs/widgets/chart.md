---
id: chart
title: Chart
---
# Chart

Chart widget takes the chart type, data and styles to draw charts using Plotly.js.

## How To Use Chart Widget

<iframe height="500" src="https://www.youtube.com/embed/F3OALU_B5PE" title="Chart Widget" frameborder="0" allowfullscreen width="100%"></iframe>

## Chart types
### Line charts

**Data requirements:** The data needs to be an array of objects and each object should have `x` and `y` keys.

**Example:**
```json
[
  { "x": "Jan", "y": 100},
  { "x": "Feb", "y": 80},
  { "x": "Mar", "y": 40},
  { "x": "Apr", "y": 100},
  { "x": "May", "y": 80},
  { "x": "Jun", "y": 40}
]
```

The chart will look like this:

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Chart](/img/widgets/chart/linec.png)

</div>

### Bar charts

**Data requirements:** The data needs to be an array of objects and each object should have `x` and `y` keys.

**Example:**

```json
[
  { "x": "Jan", "y": 100},
  { "x": "Feb", "y": 80},
  { "x": "Mar", "y": 40},
  { "x": "Apr", "y": 100},
  { "x": "May", "y": 80},
  { "x": "Jun", "y": 40},
  { "x": "Jul", "y": 100},
  { "x": "Aug", "y": 80},
  { "x": "Sep", "y": 40}
]
```

The chart will look like this:

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Chart](/img/widgets/chart/barc.png)

</div>

### Pie charts

**Data requirements:** The data needs to be an array of objects and each object should have `label` and `value` keys.

**Example:**

```json
[
  { "x": "Jan", "y": 100},
  { "x": "Feb", "y": 80},
  { "x": "Mar", "y": 40},
  { "x": "Apr", "y": 100},
  { "x": "May", "y": 80},
  { "x": "Jun", "y": 40}
]
```

The chart will look like this:

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Chart](/img/widgets/chart/piec.png)

</div>

## Properties

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

### Title

This field is used to add a title to your selected chart.

### Plotly JSON chart schema

In the chart widget, you can also plot a chart with JSON data. So the JSON will contain the information about the chart type, chart data, etc. You can learn more about the JSON properties from [here](https://plotly.com/javascript/reference/). 

Anyway, to work with the JSON you need to enable the `Use Plotly JSON schema` toggle from the properties section.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Chart](/img/widgets/chart/pfjson.png)

</div>

It will show the [JSON description](https://plotly.com/chart-studio-help/json-chart-schema/) field to put the JSON data.

The end result will be like this:

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Chart](/img/widgets/chart/jsonschema.png)

</div>

### Loading state

Toggle `on` the switch to display a loader on the widget. You can also programmatically define it's value by clicking on `Fx`, acceptable values are - `{{true}}` and `{{false}}`.

### Marker color

Modify the color of marker using the color picker or by providing a `HEX color code`.

### Show Axes

Enable or disable the `x` and `y` axes on the chart through this property. You can also programmatically define it's value by clicking on `Fx`, acceptable values are - `{{true}}` and `{{false}}`.

### Show grid lines

Toggle `on` or `off` to show or hide the grid lines on the chart. You can also programmatically define it's value by clicking on `Fx`, acceptable values are - `{{true}}` and `{{false}}`.

## Layout

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Chart](/img/widgets/chart/layout.png)

</div>

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Chart](/img/widgets/chart/styles.png)

</div>

### Padding

Define a space between the widget element and the widget border using `Padding` property. Use any numerical value between `1` to `100`.

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.
