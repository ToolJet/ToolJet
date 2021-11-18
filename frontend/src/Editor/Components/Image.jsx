import React from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';
import LazyLoad from 'react-lazyload';

export const Image = function Image({ id, height, component, onComponentClick, currentState }) {
  const source = component.definition.properties.source.value;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  let data = resolveReferences(source, currentState, null);

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }
  if (data === '') data = null;

  function Placeholder() {
    return <div className="skeleton-image" style={{ objectFit: 'contain', height }}></div>;
  }

  return (
    <div
      data-disabled={parsedDisabledState}
      style={{ display: parsedWidgetVisibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component, event);
      }}
    >
      <LazyLoad height={height} placeholder={<Placeholder />} debounce={500}>
        <img style={{ objectFit: 'contain' }} src={data} height={height} />
      </LazyLoad>
    </div>
  );
};
