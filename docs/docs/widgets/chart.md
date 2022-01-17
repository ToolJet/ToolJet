# Chart

Chart widget takes the chart type, data and styles to draw charts using Plotly.js.

Support chart types:

- Line charts
- Bar charts
- Pie charts

## Line charts

Data requirements:

The data needs to be an array of objects and each object should have `x` and `y` keys.

Example:

```
[
  { "x": "Jan", "y": 100},
  { "x": "Feb", "y": 80},
  { "x": "Mar", "y": 40}
]
```

The chart will look like this:
<img class="screenshot-full" src="/img/widgets/chart/line.png" alt="ToolJet - line charts" height="420"/>

## Bar charts

Data requirements:

The data needs to be an array of objects and each object should have `x` and `y` keys.

Example:

```
[
  { "x": "Jan", "y": 100},
  { "x": "Feb", "y": 80},
  { "x": "Mar", "y": 40}
]
```

The chart will look like this:
<img class="screenshot-full" src="/img/widgets/chart/bar.png" alt="ToolJet - line charts" height="420"/>

## Pie charts

Data requirements:

The data needs to be an array of objects and each object should have `label` and `value` keys.

Example:

```
[
  { "label": "Jan", "value": 100 },
  { "label": "Feb", "value": 80 },
  { "label": "Mar", "value": 20 }
]
```

The chart will look like this:
<img class="screenshot-full" src="/img/widgets/chart/pie.png" alt="ToolJet - line charts" height="420"/>


## Visually using JSON

In the chart widget, you can also plot a chart with JSON data. So the JSON will contain the information about the chart type, chart data, etc. You can learn more about the JSON properties from [here](https://plotly.com/javascript/reference/). 

Anyway, to work with the JSON you need to enable the ``Use Plotly JSON schema`` toggle from the properties section.
<img class="screenshot-full" src="/img/widgets/chart/plot_from_json.png" alt="ToolJet - line charts" height="420"/>

It will show the ``Json description`` field to put the JSON data.

The end result will be like this:
<img class="screenshot-full" src="/img/widgets/chart/from_json.png" alt="ToolJet - line charts" height="420"/>
