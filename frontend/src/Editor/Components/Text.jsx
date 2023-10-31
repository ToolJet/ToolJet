import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Markdown from 'react-markdown';

export const Text = function Text({ height, properties, styles, darkMode, setExposedVariable, dataCy, fireEvent }) {
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
    boxShadow,
  } = styles;
  const { loadingState, textFormat, disabledState } = properties;
  const [text, setText] = useState(() => computeText());
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isLoading, setLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);
  const color = ['#000', '#000000'].includes(textColor) ? (darkMode ? '#fff' : '#000') : textColor;

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isLoading !== loadingState) setLoading(loadingState);
    if (isDisabled !== disabledState) setIsDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, loadingState, disabledState]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const text = computeText();
    setText(text);
    setExposedVariable('text', text);

    setExposedVariable('setText', async function (text) {
      setText(text);
      setExposedVariable('text', text);
    });
    setExposedVariable('clear', async function (text) {
      setText('');
      setExposedVariable('text', '');
    });
    setExposedVariable('isVisible', properties.visibility);
    setExposedVariable('isLoading', loadingState);
    setExposedVariable('isDisabled', disabledState);

    setExposedVariable('visibility', async function (value) {
      setVisibility(value);
    });

    setExposedVariable('setVisibility', async function (value) {
      setVisibility(value);
    });

    setExposedVariable('setLoadingState', async function (value) {
      setLoading(value);
    });

    setExposedVariable('setDisabled', async function (value) {
      setIsDisabled(value);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    properties.text,
    setText,
    setVisibility,
    properties.visibility,
    loadingState,
    disabledState,
    setIsDisabled,
    setLoading,
  ]);

  function computeText() {
    return properties.text === 0 || properties.text === false ? properties.text?.toString() : properties.text;
  }

  const handleClick = () => {
    fireEvent('onClick');
  };

  const computedStyles = {
    backgroundColor,
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
    boxShadow,
  };

  return (
    <div
      data-disabled={isDisabled}
      className="text-widget"
      style={computedStyles}
      data-cy={dataCy}
      onMouseOver={() => {
        fireEvent('onHover');
      }}
      onClick={handleClick}
    >
      {!isLoading &&
        (textFormat === 'markdown' ? (
          <Markdown>{text}</Markdown>
        ) : (
          <div
            style={{ width: '100%', fontSize: textSize }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
          />
        ))}
      {isLoading && (
        <div style={{ width: '100%' }}>
          <center>
            <div className="spinner-border" role="status"></div>
          </center>
        </div>
      )}
    </div>
  );
};
