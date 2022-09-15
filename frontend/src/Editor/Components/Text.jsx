import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

export const Text = function Text({ height, properties, styles, darkMode, registerAction }) {
  let {
    textSize,
    textColor,
    textAlign,
    backgroundColor,
    fontWeight,
    decoration,
    transformation,
    fontStyle,
    lineHeight,
    textIndent,
    letterSpacing,
    wordSpacing,
    fontVariant,
    disabledState: disable,
  } = styles;
  const { loadingState: loading } = properties;
  // const [loadingState, setLoadingState] = useState(false);
  const [text, setText] = useState(() => computeText());

  const [visibility, setVisibility] = useState(styles.visibility);
  useEffect(() => setVisibility(styles.visibility), [styles.visibility]);

  const color = textColor === '#000' ? (darkMode ? '#fff' : '#000') : textColor;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setText(() => computeText()), [properties.text]);

  registerAction('setText', async function (text) {
    setText(text);
  });
  registerAction('visibility', async function (value) {
    setVisibility(value);
  });

  function computeText() {
    return properties.text === 0 || properties.text === false ? properties.text?.toString() : properties.text;
  }

  const computedStyles = {
    backgroundColor: darkMode && backgroundColor === '#fff' ? '#232E3C' : backgroundColor,
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
    fontVariant: fontVariant ?? 'normal',
    textIndent: `${textIndent}px` ?? '0px',
    letterSpacing: `${letterSpacing}px` ?? '0px',
    wordSpacing: `${wordSpacing}px` ?? '0px',
  };

  return (
    <div data-disabled={disable} className="text-widget" style={computedStyles}>
      {!loading && (
        <div
          style={{ width: '100%', fontSize: textSize }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
        />
      )}
      {loading === true && (
        <div style={{ width: '100%' }}>
          <center>
            <div className="spinner-border" role="status"></div>
          </center>
        </div>
      )}
    </div>
  );
};
