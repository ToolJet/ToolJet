import React, { useState, useEffect } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import DOMPurify from 'dompurify';

export const Text = function Text({ height, currentState, properties, styles }) {
  const [loadingState, setLoadingState] = useState(false);

  const { textColor, visibility, disabledState } = styles;
  const text = properties.text ?? '';
  const color = textColor;

  useEffect(() => {
    const loadingStateProperty = properties.loadingState;
    if (loadingStateProperty && currentState) {
      setLoadingState(loadingStateProperty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    height,
    display: visibility ? 'flex' : 'none',
    alignItems: 'center',
  };

  return (
    <div data-disabled={disabledState} className="text-widget" style={computedStyles}>
      {!loadingState && <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }} />}
      {loadingState === true && (
        <div>
          <div className="skeleton-line w-10"></div>
        </div>
      )}
    </div>
  );
};
