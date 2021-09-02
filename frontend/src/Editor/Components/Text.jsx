import React, { useState, useEffect } from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';
import DOMPurify from 'dompurify';
import Skeleton from 'react-loading-skeleton';

export const Text = function Text({
  id, width, height, component, onComponentClick, currentState
}) {
  const text = component.definition.properties.text.value;
  const color = component.definition.styles.textColor.value;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState = typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    const loadingStateProperty = component.definition.properties.loadingState;
    if (loadingStateProperty && currentState) {
      const newState = resolveReferences(loadingStateProperty.value, currentState, false);
      setLoadingState(newState);
    }
  }, [currentState]);

  let data = text;
  if (currentState) {
    const matchedParams = text.match(/\{\{(.*?)\}\}/g);

    if (matchedParams) {
      for (const param of matchedParams) {
        const resolvedParam = resolveReferences(param, currentState, '');
        console.log('resolved param', param, resolvedParam);
        data = data.replace(param, resolvedParam);
      }
    }
  }

  let parsedWidgetVisibility = widgetVisibility;
  
  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) { console.log(err); }

  const computedStyles = {
    color,
    width,
    height,
    display: parsedWidgetVisibility ? 'flex' : 'none',
    alignItems: 'center'
  };

  return (
    <div data-disabled={parsedDisabledState} className="text-widget" style={computedStyles} onClick={event => {event.stopPropagation(); onComponentClick(id, component)}}>
      {!loadingState && <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }} />}
      {loadingState === true && (
        <div>
          <div className="skeleton-line w-10"></div>
        </div>
      )}
    </div>
  );
};
