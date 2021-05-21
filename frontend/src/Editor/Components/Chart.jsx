import React, { useState, useEffect } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import Plot from 'react-plotly.js';
import Skeleton from 'react-loading-skeleton';

export const Chart = function Chart({
  id, width, height, component, onComponentClick, currentState
}) {
  console.log('currentState', currentState);

  const [loadingState, setLoadingState] = useState(false);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const loadingStateProperty = component.definition.properties.loadingState;
    if (loadingStateProperty && currentState) {
      const newState = resolveReferences(loadingStateProperty.value, currentState, false);
      setLoadingState(newState);
    }
  }, [currentState]);

  const computedStyles = {
    width,
    height,
    backgroundColor: 'white'
  };

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

  useEffect(() => {
    let data =  resolveReferences(dataString, currentState, []);

    if(typeof data === 'string') {
      try {
        data = JSON.parse(dataString);
      } catch (err) { data = []; }
    }

    const newData = [{
      type: chartType || 'line',
      x: data.map((item) => item["x"]),
      y: data.map((item) => item["y"]),
      marker: { color: markerColor }
    }];

    setChartData(newData);
    
  }, [dataString]);

  return (
    <div
      style={computedStyles}
      onClick={() => onComponentClick(id, component)}
    >
      {loadingState === true ? 
        <div style={{ width: '100%' }} className="p-2">
          <Skeleton count={5} />
        </div>
      :
        <Plot
          data={chartData}
          layout={layout}
          config={{
            displayModeBar: false,
            staticPlot: true
          }}
        />
      } 
    </div>
  );
};
