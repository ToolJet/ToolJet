import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Markdown from 'react-markdown';
import './text.scss';
import Loader from '@/ToolJetUI/Loader/Loader';

const VERTICAL_ALIGNMENT_VS_CSS_VALUE = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
};

export const Text = function Text({ height, properties, fireEvent, styles, darkMode, setExposedVariable, dataCy }) {
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
    verticalAlignment,
    borderColor,
    borderRadius,
    isScrollRequired,
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

    setExposedVariable('setLoading', async function (value) {
      setLoading(value);
    });

    setExposedVariable('setDisable', async function (value) {
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
    height: `${height}px`,
    backgroundColor: darkMode && ['#edeff5'].includes(backgroundColor) ? '#2f3c4c' : backgroundColor,
    color,
    display: visibility ? 'flex' : 'none',
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
    border: '1px solid',
    borderColor: darkMode && ['#f2f2f5'].includes(borderColor) ? '#2f3c4c' : borderColor ? borderColor : 'transparent',
    borderRadius: borderRadius ? `${borderRadius}px` : '0px',
    fontSize: `${textSize}px`,
  };

  const commonStyles = {
    width: '100%',
    height: '100%',
    overflowY: isScrollRequired == 'enabled' ? 'auto' : 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: VERTICAL_ALIGNMENT_VS_CSS_VALUE[verticalAlignment],
    textAlign,
    overflowX: isScrollRequired === 'disabled' && 'hidden',
  };

  const commonScrollStyle = {
    overflowY: isScrollRequired == 'enabled' ? 'scroll' : 'hidden',
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
      {!isLoading && (
        <div style={commonStyles} className="text-widget-section">
          {textFormat === 'plainText' && <div style={commonScrollStyle}>{text}</div>}
          {textFormat === 'markdown' && (
            <div style={commonScrollStyle}>
              <Markdown className={'reactMarkdown'}>{text}</Markdown>
            </div>
          )}
          {(textFormat === 'html' || !textFormat) && (
            <div
              style={commonScrollStyle}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(text || ''),
              }}
            />
          )}
        </div>
      )}
      {isLoading === true && (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <center>
            <Loader width="16" absolute={false} />
          </center>
        </div>
      )}
    </div>
  );
};
