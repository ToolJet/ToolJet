import React, { useState, useEffect } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import DOMPurify from 'dompurify';
import Skeleton from 'react-loading-skeleton';

export const Text = function Text({
  id, width, height, component, onComponentClick, currentState
}) {
  const text = component.definition.properties.text.value;
  const color = component.definition.styles.textColor.value;

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

  const computedStyles = {
    color,
    width,
    height
  };

  return (
    <div className="text-widget" style={computedStyles} onClick={() => onComponentClick(id, component)}>
      {!loadingState && <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }} />}
      {loadingState === true && (
        <div>
          <Skeleton count={1} />
        </div>
      )}
    </div>
  );
};
