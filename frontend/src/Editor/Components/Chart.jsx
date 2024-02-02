import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';

// Use plotly basic bundle
import Plotly from 'plotly.js-basic-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import { isJson } from '@/_helpers/utils';
const Plot = createPlotlyComponent(Plotly);
import { isEqual, cloneDeep } from 'lodash';

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

  const { padding, visibility, disabledState, boxShadow } = styles;
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
  };
  const dataString = data ?? [];

  const chartType = type;

  const isDescriptionJson = isJson(jsonDescription);

  const jsonChartData = isDescriptionJson ? JSON.parse(jsonDescription).data : [];

  const chartLayout = isDescriptionJson ? JSON.parse(jsonDescription).layout ?? {} : {};

  const fontColor = darkMode ? '#c3c3c3' : null;

  const chartTitle = plotFromJson ? chartLayout?.title?.text ?? title : title;

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
    plot_bgcolor: darkMode ? '#1f2936' : null,
    paper_bgcolor: darkMode ? '#1f2936' : null,
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

  const handleClick = useCallback(
    (data) => {
      if (data.length > 0) {
        console.log('here--- single', data[0]);
        const { x: xAxisLabel, y: yAxisLabel, label: dataLabel, value: dataValue, percent: dataPercent } = data[0];
        setExposedVariable('clickedDataPoint', {
          xAxisLabel,
          yAxisLabel,
          dataLabel,
          dataValue,
          dataPercent,
        });
        fireEvent('onClick');
      }
    },
    [chartTitle]
  );

  const handleDoubleClick = useCallback((data) => {
    if (data.length > 0) {
      console.log('here--- double', data[0]);
    }
  }, []);

  useEffect(() => {
    setExposedVariable('clearClickedPoint', () => {
      setExposedVariable('clickedDataPoint', {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-disabled={disabledState} style={computedStyles} data-cy={dataCy}>
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
          console.log('here--- onclick');
          onClick(e.points);
        }}
        onDoubleClick={() => {
          console.log('here--- ondoubleclick');
          // onDoubleClick(e.points);
        }}
      />
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps)
);
