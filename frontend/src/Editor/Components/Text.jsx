import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Markdown from "react-markdown";

export const Text = function Text({
  height,
  properties,
  styles,
  darkMode,
  registerAction,
  setExposedVariable,
  dataCy,
}) {
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
    disabledState,
    boxShadow,
  } = styles;
  const { loadingState } = properties;
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState(styles.visibility);
  const color = ['#000', '#000000'].includes(textColor) ? (darkMode ? '#fff' : '#000') : textColor;

  useEffect(() => {
    if (visibility !== styles.visibility) setVisibility(styles.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles.visibility]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const text = computeText();
    setText(text);
    setExposedVariable('text', text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.text]);

  registerAction(
    'setText',
    async function (text) {
      setText(text);
      setExposedVariable('text', text);
    },
    [setText]
  );
  registerAction(
    'visibility',
    async function (value) {
      setVisibility(value);
    },
    [setVisibility]
  );

  function computeText() {
    if (properties.text instanceof String)
      return properties.text
    else if (typeof properties.text == 'object')
      return JSON.stringify(properties.text)
    else
      return properties.text?.toString() || ""
  }

  const computedStyles = {
    backgroundColor,
    color,
    height,
    display: visibility ? (properties.markDownMode ? '' : 'flex') : 'none',
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
    boxShadow,
  };
  //添加Markdown解析
  return (
    <div data-disabled={disabledState} className="text-widget" style={computedStyles} data-cy={dataCy}>
      {loadingState ? (
        <div style={{ width: '100%' }}>
          <center>
            <div className="spinner-border" role="status"></div>
          </center>
        </div>
      ) : properties.markDownMode ? (<Markdown>{text}</Markdown>) : (
        <div
          style={{ width: '100%', fontSize: textSize }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(properties.parseEnter ? text.replaceAll('\n', '<br>') : text) }}
        />
      )}
    </div>
  );
};
