function extractTitleText(rawTitle) {
  return rawTitle && typeof rawTitle === 'object' ? rawTitle.text : rawTitle;
}

export function resolveChartTitle(chartLayout, title, plotFromJson) {
  if (!plotFromJson) return title;
  return extractTitleText(chartLayout?.title) ?? title;
}

export function buildChartLayout({
  chartLayout,
  chartTitle,
  width,
  height,
  padding,
  updatedBgColor,
  modifiedTextColor,
  fontColor,
  modifiedGridLines,
  modifiedAxisColor,
  showGridLines,
  showAxes,
  barmode,
}) {
  const axisDefaults = () => ({
    showgrid: showGridLines,
    showline: true,
    color: fontColor,
    automargin: true,
    visible: showAxes,
    gridcolor: modifiedGridLines,
    linecolor: modifiedAxisColor,
    title: {
      font: {
        color: modifiedTextColor,
      },
    },
    tickfont: {
      color: modifiedTextColor,
    },
  });

  const jsonTitleObj = chartLayout.title && typeof chartLayout.title === 'object' ? chartLayout.title : undefined;

  return {
    ...chartLayout,
    ...(chartLayout.autosize === true ? { autosize: true } : { width: width - 6, height: height - 2 }),
    plot_bgcolor: chartLayout.plot_bgcolor ?? updatedBgColor,
    paper_bgcolor: chartLayout.paper_bgcolor ?? updatedBgColor,
    title: {
      font: {
        color: modifiedTextColor,
      },
      ...jsonTitleObj,
      text: chartTitle,
    },
    showlegend: chartLayout.showlegend ?? false,
    legend: {
      text: chartTitle,
      font: {
        color: fontColor,
      },
      ...chartLayout.legend,
    },
    xaxis: {
      ...axisDefaults(),
      ...chartLayout.xaxis,
    },
    yaxis: {
      ...axisDefaults(),
      ...chartLayout.yaxis,
    },
    // Dynamically add additional axes (xaxis2, yaxis2, yaxis3, etc.) from user layout
    ...Object.keys(chartLayout)
      .filter((key) => /^(xaxis|yaxis)\d+$/.test(key))
      .reduce((acc, key) => {
        acc[key] = {
          ...axisDefaults(),
          ...chartLayout[key],
        };
        return acc;
      }, {}),
    margin: {
      l: padding,
      r: padding,
      b: padding,
      t: padding,
      ...chartLayout.margin,
    },
    ...(chartLayout.annotations && { annotations: chartLayout.annotations }),
    barmode: barmode,
    hoverlabel: { namelength: -1 },
    ...('dragmode' in chartLayout && { dragmode: chartLayout.dragmode }),
  };
}
