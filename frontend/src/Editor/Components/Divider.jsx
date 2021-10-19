import React from 'react';
import { resolveWidgetFieldValue } from '@/_helpers/utils';

export const Divider = function Divider({ id, component, onComponentClick, currentState }) {
  const dividerColorProperty = component.definition.styles.dividerColor;
  const color = dividerColorProperty ? dividerColorProperty.value : '#E7E8EA';
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;

  let parsedWidgetVisibility = widgetVisibility;

  parsedWidgetVisibility = resolveWidgetFieldValue(parsedWidgetVisibility, currentState);

  return (
    <div
      className="hr mt-1"
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
      style={{ display: parsedWidgetVisibility ? '' : 'none', color: color, opacity: '1' }}
    ></div>
  );
};
