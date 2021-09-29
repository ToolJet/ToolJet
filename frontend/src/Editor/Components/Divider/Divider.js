/* eslint-disable prettier/prettier */
import '@/_styles/widgets/star-rating.scss';

import React from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

import VerticalDivider from './icons/VerticalDivider';
import HorizontalDivider from './icons/HorizontalDivider';



export const Divider = function Divider({
  id,
  component,
  onComponentClick,
  currentState,
  width,
  height,
}) {

  const textColorProperty = component.definition.styles.textColor;
  const color = textColorProperty ? textColorProperty.value : '#ffb400';
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;
  const makeHorizontal = component.definition.properties.makeHorizontal.value ?? false;

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
      {makeHorizontal ? 
        <HorizontalDivider
          fill={color}
          width={width}
          height={height}
        /> : 
        <VerticalDivider
          fill={color}
          width={width}
          height={height}
        />}
      
     </div>
  );
};
