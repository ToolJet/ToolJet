---
id: chart-examples
title: Examples
---

## Plotly Configuration

You can refer to the **[Ploty's documentation](https://plotly.com/chart-studio-help/json-chart-schema/)** for information on Ploty's JSON Chart Schema.

### Bar Mode

The **Bar Mode** option allows you to customize the layout and display style specifically for bar charts. This option becomes available when the **Plotly JSON chart schema** toggle is enabled and a JSON schema specific to bar charts is provided. This option provide different modes for organizing and presenting bars within the chart.

Please note that the **Bar Mode** option only affects the layout of bar charts, and it requires a JSON schema specifically designed for bar charts. It cannot be used to modify the layout of other chart types such as line charts or pie charts.

It offers four different modes:

**1. Stack Mode:** Bars are stacked on top of each other, displaying the total value of each category as well as the individual values within the stack.

**2. Group Mode:** Bars of different categories are grouped together side by side, facilitating direct comparison between the groups and their subcategories.

**3. Overlay Mode:** Bars from different categories overlap with slight offsets, allowing for detailed visual comparison of individual values across categories.

**4. Relative Mode:** Bars represent proportions or percentages relative to a reference value, emphasizing the relative significance of each category.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/chart/barmodes.png" alt="ToolJet - Widget Reference - Chart" />

</div>

## Examples of Plotly JSON chart schema

In the **JSON description**, the value needs to be the `data` array with x and y axis values and at the end we need to specify the `type`. let's take a look at the examples for different chart types.
### Line

```bash
  {
    "data": [
        {
            "x": [
                "Jan",
                "Feb",
                "Mar"
            ],
            "y": [
                100,
                80,
                40
            ],
            "type": "line"
        },
        {
            "x": [
                "Jan",
                "Feb",
                "Mar"
            ],
            "y": [
                300,
                30,
                20
            ],
            "type": "line"
        }
    ]
}
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/chart/plotly/line.png" alt="ToolJet - Widget Reference - Chart" />

</div>

### Bar

```bash
{
    "data": [
        {
            "name": "SF Zoo",
            "type": "bar",
            "x": [
                20,
                14,
                23
            ],
            "y": [
                "giraffes",
                "orangutans",
                "monkeys"
            ],
            "marker": {
                "line": {
                    "color": "rgba(55, 128, 191, 1.0)",
                    "width": 1
                },
                "color": "rgba(55, 128, 191, 0.6)"
            },
            "orientation": "h"
        },
        {
            "name": "LA Zoo",
            "type": "bar",
            "x": [
                12,
                18,
                29
            ],
            "y": [
                "giraffes",
                "orangutans",
                "monkeys"
            ],
            "marker": {
                "line": {
                    "color": "rgba(255, 153, 51, 1.0)",
                    "width": 1
                },
                "color": "rgba(255, 153, 51, 0.6)"
            },
            "orientation": "h"
        }
    ],
    "layout": {
        "barmode": "stack"
    },
    "frames": []
}
```
<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/chart/plotly/bar2.png" alt="ToolJet - Widget Reference - Chart" />

</div>

### Candlestick

```bash
{
  "data": [
    {
      "x": ["2024-04-02", "2024-04-03", "2024-04-04"],
      "close": [120, 125, 130],
      "high": [125, 130, 135],
      "low": [115, 120, 125],
      "open": [115, 120, 125],
      "type": "candlestick"
    }
  ],
  "layout": {
    "title": "Candlestick Chart"
  }
}
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/chart/plotly/area.png" alt="ToolJet - Widget Reference - Chart" />
</div>

### Candlestick

```bash
{
  "data": [
    {
      "x": ["2024-04-02", "2024-04-03", "2024-04-04"],
      "close": [120, 125, 130],
      "high": [125, 130, 135],
      "low": [115, 120, 125],
      "open": [115, 120, 125],
      "type": "candlestick"
    }
  ],
  "layout": {
    "title": "Candlestick Chart"
  }
}
```

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/widgets/chart/plotly/area.png" alt="ToolJet - Widget Reference - Chart" />
</div>


:::tip
Check the **[Plotly documentation](https://plotly.com/chart-studio-help/json-chart-schema/#more-examples)** to explore the all type of charts available.
:::


---
