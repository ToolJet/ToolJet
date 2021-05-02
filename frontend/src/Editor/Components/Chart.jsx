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

  return (
    <div
      style={computedStyles}
      onClick={() => onComponentClick(id, component)}
    >
      <Plot
        data={[
          {
            x: [1, 2, 3],
            y: [2, 6, 3],
            type: 'scatter',
            marker: {color: 'red'},
          },
          {type: 'line', x: [1, 2, 3], y: [2, 5, 3]},
        ]}
        layout={ {width: width, height: height, title: 'A Fancy Plot'} }
      />
    </div>
  );
};
