import React from 'react';
import { resolve } from '@/_helpers/utils';

export const Image = function Image({
  id, width, height, component, onComponentClick, currentState
}) {
  const source = component.definition.properties.source.value;

  let data = source;
  if (currentState) {
    const matchedParams = source.match(/\{\{(.*?)\}\}/g);

    if (matchedParams) {
      for (const param of matchedParams) {
        const resolvedParam = resolve(param, currentState, '');
        console.log('resolved param', param, resolvedParam);
        data = data.replace(param, resolvedParam);
      }
    }
  }

  return (
    <div onClick={() => onComponentClick(id, component)}>
      <img src={data} width={width} height={height} />
    </div>
  );
};
