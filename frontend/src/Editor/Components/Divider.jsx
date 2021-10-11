import React from 'react';
import { resolveWidgetFieldValue } from '@/_helpers/utils';

export const Divider = function Divider({ id, component, onComponentClick, currentState }) {
  const dividerColorProperty = component.definition.styles.dividerColor;
  const color = dividerColorProperty ? dividerColorProperty.value : '#ffb400';
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;

  let parsedWidgetVisibility = widgetVisibility;

  parsedWidgetVisibility = resolveWidgetFieldValue(parsedWidgetVisibility, currentState);

  return (
    <div
      className="hr"
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
      style={{ display: parsedWidgetVisibility ? '' : 'none', color: color, margin: '10px', opacity: '1' }}
    ></div>
  );
};
