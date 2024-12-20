---
id: chart-properties
title: Properties
---
# Chart

The Chart component allows you to visualize your data. In this document, we'll go through all the configuration options for the **Chart** component.  

## Title

Under the `Title` property, you can enter a title that displays at the top of the chart component.

## Plotly JSON Chart Schema

To activate the Plotly JSON Schema, switch on the `Use Plotly JSON Schema` toggle. Additionally, for dynamic configuration, click on `fx` to input a logical expression that enables or disables it as needed.

## Component specific actions (CSA)

There are currently no CSA (Component-Specific Actions) implemented to regulate or control the component.


## Exposed variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:---------- | :---------- | :------------ |
| chartTitle       | Holds the title of the chart component. | Accessible dynamically with JS (for e.g., `{{components.chart1.chartTitle}}`). |
| xAxisTitle         | Contains the title for the X-axis of the chart.        | Accessible dynamically with JS (for e.g., `{{components.chart1.xAxisTitle}}`). |
| yAxisTitle         | Contains the title for the Y-axis of the chart.        | Accessible dynamically with JS (for e.g., `{{components.chart1.yAxisTitle}}`). |
| clickedDataPoints  | Stores details about the data points that were clicked.| Accessible dynamically with JS (for e.g., `{{components.chart1.clickedDataPoints}}`). Each data point includes `xAxisLabel`, `yAxisLabel`, `dataLabel`, `dataValue`, and `dataPercent`. |

## Properties

#### Chart type
You can select the type from the dropdown options or dynamically configure the value by clicking on `fx` and entering a logical expression that returns `line`, `pie` or `bar`.

## Chart data
The data needs to be in JSON format and should have `x` and `y` keys. The component supports string and object JSON data types. 

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

## Marker Color
Available for line and bar charts, `Marker Color` defines the color of the line or bars on the chart.

## Options
| <div style={{ width:"100px"}}> Option </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:------------------|:------------|:------------------------------|
| Loading state      | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically.   | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Show axis      | Hides or displays the axes on the chart. | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |
| Show grid lines      | Hides or displays the grid lines on the chart. | Enable/disable the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression. |

## Events

| Event               | Description                                                     |
|:--------------------|----------------------------------------------------------------|
| On data point click | Triggers whenever the user clicks on data points.               |
| On double click     | Triggers whenever the user double clicks on the chart area.    |

:::info
Check [Action Reference](/docs/category/actions-reference) docs to get detailed information about all the **Actions**.
:::

## Devices

| Property           | Description                                                                 | Expected Value                                                                 |
|:-------------------|:----------------------------------------------------------------------------|:-------------------------------------------------------------------------------|
| Show on desktop    | Makes the component visible in desktop view.                                | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.     |
| Show on mobile     | Makes the component visible in mobile view.                                 | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression.     |

# Styles

| <div style={{ width:"100px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| Background color       | Sets the background color of the component.                                                   | Select the color or click on `fx` and input code that programmatically returns a Hex color code.          |
| Paddings       | Sets the padding of the component.                                                   | Enter a numeric value. (for e.g., `22`)    |
| Border radius   | Modifies the border radius of the component.                                                  | Enter a number or click on `fx` and enter a code that programmatically returns a numeric value.           |
| Visibility   | Sets the visibility of the component.                                                  | Enable/disable using the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression.|
| Disables   | Allows you to enable/disable a component. The component is not interactive when it is disabled.                                                  | Enable/disable using the toggle button or dynamically configure the value by clicking on `fx` and entering a logical expression.|
