---
sidebar_position: 2
---

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
  { "x": 100, "y": "Jan"},
  { "x": 80, "y": "Feb"},
  { "x": 40, "y": "Mar"}
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
  { "x": 100, "y": "Jan"},
  { "x": 80, "y": "Feb"},
  { "x": 40, "y": "Mar"}
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
