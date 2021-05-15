import React, { useState, useEffect } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import Plot from 'react-plotly.js';

export const Chart = function Chart({
  id, width, height, component, onComponentClick, currentState
}) {
  console.log('currentState', currentState);

  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    const loadingStateProperty = component.definition.properties.loadingState;
    if (loadingStateProperty && currentState) {
      const newState = resolveReferences(loadingStateProperty.value, currentState, false);
      setLoadingState(newState);
    }
  }, [currentState]);

  const computedStyles = {
    width,
    height
  };

  const dataProperty = component.definition.properties.data;
  const dataString = dataProperty ? dataProperty.value : [];
  const data = JSON.parse(dataString);

  const titleProperty = component.definition.properties.title;
  const title = titleProperty.value;

  const typeProperty = component.definition.properties.type;
  const chartType = typeProperty.value;

  const markerColorProperty = component.definition.properties.markerColor;
  const markerColor = markerColorProperty ? markerColorProperty.value : 'red';

  const gridLinesProperty = component.definition.properties.showGridLines;
  const showGridLines = gridLinesProperty ? gridLinesProperty.value : true;

  const chartData = [{
    type: chartType || 'line',
    x: data.map((item) => item["x"]),
    y: data.map((item) => item["y"]),
    marker: { color: markerColor }
  }];

  const layout = {
    width, 
    height, 
    title,
    xaxis: {
      showgrid: showGridLines,
      showline: true
    },
    yaxis: {
        showgrid: showGridLines,
        showline: true
    }
  }

  return (
    <div
      style={computedStyles}
      onClick={() => onComponentClick(id, component)}
    >
      <Plot
        data={chartData}
        layout={layout}
        config={{displayModeBar: false}}
      />
    </div>
  );
};
