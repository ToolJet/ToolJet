/* eslint-disable prettier/prettier */
import React from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

export const Divider = function Divider({
  id,
  component,
  onComponentClick,
  currentState,
}) {

  const dividerColorProperty = component.definition.styles.dividerColor;
  const color = dividerColorProperty ? dividerColorProperty.value : '#ffb400';
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  return (
    <div
      data-disabled={parsedDisabledState}
      className="divider"
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
      style={{ display: parsedWidgetVisibility ? '' : 'none' }}
    >
      <hr 
        style={{color: color, opacity: 0.7, margin: '10px'}}
      />
     </div>
  );
};
