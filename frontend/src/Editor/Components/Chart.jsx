import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';

// Use plotly basic bundle
import Plotly from 'plotly.js-basic-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import { isJson } from '@/_helpers/utils';
const Plot = createPlotlyComponent(Plotly);
import { isEqual, cloneDeep } from 'lodash';
var tinycolor = require('tinycolor2');

export const Chart = function Chart({
  width,
  height,
  darkMode,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  dataCy,
}) {
  const [loadingState, setLoadingState] = useState(false);

  const getColor = (color) => {
    if (tinycolor(color).getBrightness() > 128) return '#000';
    return '#fff';
  };

  const { padding, visibility, disabledState, boxShadow, backgroundColor, borderRadius } = styles;
  const { title, markerColor, showGridLines, type, data, jsonDescription, plotFromJson, showAxes, barmode } =
    properties;

  useEffect(() => {
    const loadingStateProperty = properties.loadingState;
    if (loadingStateProperty != undefined) {
      setLoadingState(loadingStateProperty);
    }
  }, [properties.loadingState]);

  const computedStyles = {
    width: width - 4,
    height,
    display: visibility ? '' : 'none',
    background: darkMode ? '#1f2936' : 'white',
    boxShadow,
    borderRadius,
  };
  const dataString = data ?? [];

  const chartType = type;

  const jsonData = typeof jsonDescription === 'object' ? JSON.stringify(jsonDescription) : jsonDescription;

  const isDescriptionJson = plotFromJson ? isJson(jsonData) : false;

  const jsonChartData = isDescriptionJson ? JSON.parse(jsonData).data : [];

  const chartLayout = isDescriptionJson ? JSON.parse(jsonData).layout ?? {} : {};

  const updatedBgColor = ['#fff', '#ffffff'].includes(backgroundColor)
    ? darkMode
      ? '#1f2936'
      : '#fff'
    : backgroundColor;
  const fontColor = getColor(updatedBgColor);

  const chartTitle = plotFromJson ? chartLayout?.title ?? title : title;

  useEffect(() => {
    const { xaxis, yaxis } = chartLayout;
    let xAxisTitle, yAxisTitle;
    if (xaxis) {
      xAxisTitle = xaxis?.title?.text;
    }
    if (yaxis) {
      yAxisTitle = yaxis?.title?.text;
    }
    const exposedVariables = {
      chartTitle: chartTitle,
      xAxisTitle: xAxisTitle,
      yAxisTitle: yAxisTitle,
    };
    setExposedVariables(exposedVariables);
  }, [JSON.stringify(chartLayout, chartTitle)]);

  const layout = {
    width: width - 4,
    height,
    plot_bgcolor: updatedBgColor,
    paper_bgcolor: updatedBgColor,
    title: {
      text: chartTitle,
      font: {
        color: fontColor,
      },
    },
    legend: {
      text: chartTitle,
      font: {
        color: fontColor,
      },
    },
    xaxis: {
      showgrid: showGridLines,
      showline: true,
      color: fontColor,
      automargin: true,
      visible: showAxes,
      ...chartLayout.xaxis,
    },
    yaxis: {
      showgrid: showGridLines,
      showline: true,
      color: fontColor,
      automargin: true,
      visible: showAxes,
      ...chartLayout.yaxis,
    },
    margin: {
      l: padding,
      r: padding,
      b: padding,
      t: padding,
    },
    barmode: barmode,
    hoverlabel: { namelength: -1 },
  };

  const computeChartData = (data, dataString) => {
    let rawData = data;
    if (typeof rawData === 'string') {
      try {
        rawData = JSON.parse(dataString);
      } catch (err) {
        rawData = [];
      }
    }

    if (!Array.isArray(rawData)) {
      rawData = [];
    }

    let newData = [];

    if (chartType === 'pie') {
      newData = [
        {
          type: chartType,
          values: rawData.map((item) => item['y']),
          labels: rawData.map((item) => item['x']),
        },
      ];
    } else {
      newData = [
        {
          type: chartType || 'line',
          x: rawData.map((item) => item['x']),
          y: rawData.map((item) => item['y']),
          marker: { color: markerColor },
        },
      ];
    }

    return newData;
  };

  const memoizedChartData = useMemo(
    () => computeChartData(data, dataString),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, dataString, chartType, markerColor]
  );

  const handleClick = useCallback((data) => {
    if (data.length > 0) {
      const {
        x: xAxisLabel,
        y: yAxisLabel,
        label: dataLabel,
        value: dataValue,
        percent: dataPercent,
        fullData: { name } = {},
      } = data[0];
      setExposedVariable('clickedDataPoint', {
        xAxisLabel,
        yAxisLabel,
        dataLabel,
        dataValue,
        dataPercent,
        dataSeriesName: name,
      });
      fireEvent('onClick');
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    fireEvent('onDoubleClick');
  }, []);

  useEffect(() => {
    setExposedVariable('clearClickedPoint', () => {
      setExposedVariable('clickedDataPoint', {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div class="widget-chart" data-disabled={disabledState} style={computedStyles} data-cy={dataCy}>
      {loadingState === true ? (
        <div style={{ width }} className="p-2 loader-main-container">
          <center>
            <div className="spinner-border mt-5" role="status"></div>
          </center>
        </div>
      ) : (
        <PlotComponent
          data={plotFromJson ? jsonChartData : memoizedChartData}
          layout={layout}
          config={{
            displayModeBar: false,
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        />
      )}
    </div>
  );
};

// onClick event was not working when the component is re-rendered for every click. Hance, memoization is used
const PlotComponent = memo(
  ({ data, layout, config, onClick, onDoubleClick }) => {
    return (
      <Plot
        data={data}
        layout={cloneDeep(layout)} // Cloning the layout since the object is getting mutated inside the package
        config={config}
        onClick={(e) => {
          onClick(e.points);
        }}
        onDoubleClick={() => {
          onDoubleClick();
        }}
      />
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps)
);
