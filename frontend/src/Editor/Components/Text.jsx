import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

export const Text = function Text({ height, properties, styles, darkMode }) {
  const [loadingState, setLoadingState] = useState(false);

  const { textSize, textColor, textAlign, visibility, disabledState } = styles;

  const text = properties.text === 0 || properties.text === false ? properties.text?.toString() : properties.text;

  const color = textColor === '#000' ? (darkMode ? '#fff' : '#000') : textColor;

  useEffect(() => {
    const loadingStateProperty = properties.loadingState;
    setLoadingState(loadingStateProperty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.loadingState]);

  const computedStyles = {
    color,
    height,
    display: visibility ? 'flex' : 'none',
    alignItems: 'center',
    textAlign,
  };

  return (
    <div data-disabled={disabledState} className="text-widget" style={computedStyles}>
      {!loadingState && (
        <div
          style={{ width: '100%', fontSize: textSize }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
        />
      )}
      {loadingState === true && (
        <div style={{ width: '100%' }}>
          <center>
            <div className="spinner-border" role="status"></div>
          </center>
        </div>
      )}
    </div>
  );
};
