import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

export const Text = function Text({ height, properties, styles, darkMode }) {
  const [loadingState, setLoadingState] = useState(false);

  let {
    textSize,
    textColor,
    textAlign,
    visibility,
    disabledState,
    fontWeight,
    decoration,
    transformation,
    fontStyle,
    lineHeight,
    textIndent,
    letterSpacing,
    wordSpacing,
    verticalShadow,
    horizontalShadow,
    shadowColor,
    blur,
    fontVariant,
  } = styles;

  verticalShadow = `${verticalShadow ?? '0'}px`;
  horizontalShadow = `${horizontalShadow ?? '0'}px`;
  blur = `${blur ?? '0'}px`;
  const text = properties.text === 0 || properties.text === false ? properties.text?.toString() : properties.text;
  console.log('shadow', verticalShadow, horizontalShadow, blur, shadowColor);
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
    fontWeight: fontWeight ? fontWeight : fontWeight === '0' ? 0 : 'normal',
    lineHeight: lineHeight ?? 1.5,
    textDecoration: decoration ?? 'none',
    textTransform: transformation ?? 'none',
    fontStyle: fontStyle ?? 'none',
    fontVariant: fontVariant === true ? ['small-caps'] : null,
    textIndent: `${textIndent}px` ?? '0px',
    letterSpacing: `${letterSpacing}px` ?? '0px',
    wordSpacing: `${wordSpacing}px` ?? '0px',
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
