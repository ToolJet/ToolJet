import React, { useState, useEffect } from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

// Use plotly basic bundle
import Plotly from 'plotly.js-basic-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

export const Chart = function Chart({ id, width, height, component, onComponentClick, currentState, darkMode }) {
  const [loadingState, setLoadingState] = useState(false);
  const [chartData, setChartData] = useState([]);

  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  let parsedWidgetVisibility = widgetVisibility;
  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  useEffect(() => {
    const loadingStateProperty = component.definition.properties.loadingState;
    if (loadingStateProperty && currentState) {
      const newState = resolveReferences(loadingStateProperty.value, currentState, false);
      setLoadingState(newState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState]);

  const computedStyles = {
    width,
    height,
    display: parsedWidgetVisibility ? '' : 'none',
    background: darkMode ? '#1f2936' : 'white',
  };

  // darkMode ? '#1f2936' : 'white'
  const dataProperty = component.definition.properties.data;
  const dataString = dataProperty ? dataProperty.value : [];

  const titleProperty = component.definition.properties.title;
  const title = titleProperty.value;

  const typeProperty = component.definition.properties.type;
  const chartType = typeProperty.value;

  const markerColorProperty = component.definition.properties.markerColor;
  const markerColor = markerColorProperty ? markerColorProperty.value : 'red';

  const gridLinesProperty = component.definition.properties.showGridLines;
  const showGridLines = gridLinesProperty ? gridLinesProperty.value : true;
  const fontColor = darkMode ? '#c3c3c3' : null;

  const layout = {
    width,
    height,
    plot_bgcolor: darkMode ? '#1f2936' : null,
    paper_bgcolor: darkMode ? '#1f2936' : null,
    title: {
      text: title,
      font: {
        color: fontColor,
      },
    },
    legend: {
      text: title,
      font: {
        color: fontColor,
      },
    },
    xaxis: {
      showgrid: showGridLines,
      showline: true,
      color: fontColor,
    },
    yaxis: {
      showgrid: showGridLines,
      showline: true,
      color: fontColor,
    },
  };

  const data = resolveReferences(dataString, currentState, []);

  useEffect(() => {
    let rawData = data || [];
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
          values: rawData.map((item) => item['value']),
          labels: rawData.map((item) => item['label']),
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

    setChartData(newData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, chartType]);

  return (
    <div
      data-disabled={parsedDisabledState}
      style={computedStyles}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
    >
      {loadingState === true ? (
        <div style={{ width: '100%' }} className="p-2">
          <center>
            <div className="spinner-border mt-5" role="status"></div>
          </center>
        </div>
      ) : (
        <Plot
          data={chartData}
          layout={layout}
          config={{
            displayModeBar: false,
            // staticPlot: true
          }}
        />
      )}
    </div>
  );
};
