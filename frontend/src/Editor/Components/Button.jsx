import React, { useState, useEffect } from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';
var tinycolor = require('tinycolor2');

export const Button = function Button({ id, width, height, component, onComponentClick, currentState }) {
  console.log('currentState', currentState);
  const x = 'hello';

  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    const loadingStateProperty = component.definition.properties.loadingState;
    if (loadingStateProperty && currentState) {
      const newState = resolveReferences(loadingStateProperty.value, currentState, false);
      setLoadingState(newState);
    }
  }, [currentState]);

  const text = component.definition.properties.text.value;
  const backgroundColor = component.definition.styles.backgroundColor.value;
  const color = component.definition.styles.textColor.value;
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

  const computedStyles = {
    backgroundColor,
    color,
    width,
    height,
    display: parsedWidgetVisibility ? '' : 'none',
    '--tblr-btn-color-darker': tinycolor(backgroundColor).darken(8).toString(),
  };

  return (
    <button
      disabled={parsedDisabledState}
      className={`jet-button btn btn-primary p-1 ${loadingState === true ? ' btn-loading' : ''}`}
      style={computedStyles}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
    >
      {text}
    </button>
  );
};
