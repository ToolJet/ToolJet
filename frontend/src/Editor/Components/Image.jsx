import React from 'react';
import { resolveReferences } from '@/_helpers/utils';
import LazyLoad from 'react-lazyload';

export const Image = function Image({
  id, width, height, component, onComponentClick, currentState
}) {
  const source = component.definition.properties.source.value;

  let data = resolveReferences(source, currentState, null);
  if (data === '') data = null;

  function Placeholder() {
    return (
      <div className="skeleton-image" style={{ objectFit: 'contain', width, height }}></div>
    );
  }

  return (
    <div onClick={() => onComponentClick(id, component)}>
      <LazyLoad width={width} height={height} placeholder={<Placeholder/>} debounce={500}>
        <img style={{ objectFit: 'contain' }} src={data} width={width} height={height} />
      </LazyLoad>
    </div>
  );
};
