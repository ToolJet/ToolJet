import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
// eslint-disable-next-line import/no-unresolved
import Markdown from 'react-markdown';
import './text.scss';
import Loader from '@/ToolJetUI/Loader/Loader';

const VERTICAL_ALIGNMENT_VS_CSS_VALUE = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
};

let count = 0;

export const Text = function Text({
  id,
  height,
  properties,
  fireEvent,
  styles,
  darkMode,
  setExposedVariable,
  setExposedVariables,
  dataCy,
  adjustComponentPositions,
  currentLayout,
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
    boxShadow,
    verticalAlignment,
    borderColor,
    borderRadius,
    isScrollRequired,
  } = styles;
  const isInitialRender = useRef(true);
  const { loadingState, textFormat, disabledState, dynamicHeight } = properties;
  const [text, setText] = useState(() => computeText());
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isLoading, setLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);
  const color = ['#000', '#000000'].includes(textColor) ? (darkMode ? '#fff' : '#000') : textColor;
  count = count + 1;
  const prevDynamicHeight = useRef(dynamicHeight);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isLoading !== loadingState) setLoading(loadingState);
    if (isDisabled !== disabledState) setIsDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, loadingState, disabledState]);

  useEffect(() => {
    if (dynamicHeight) {
      const element = document.querySelector(`.ele-${id}`);
      if (element) {
        element.style.height = 'auto';
        // Wait for the next frame to ensure the height has updated
        requestAnimationFrame(() => {
          adjustComponentPositions(id, currentLayout, false);
        });
      }
    } else if (!dynamicHeight && prevDynamicHeight.current) {
      const element = document.querySelector(`.ele-${id}`);
      if (element) {
        element.style.height = `${height}px`;
        requestAnimationFrame(() => {
          adjustComponentPositions(id, currentLayout, false);
        });
      }
    }
    prevDynamicHeight.current = dynamicHeight;
  }, [dynamicHeight, id, text, adjustComponentPositions, currentLayout, height]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const text = computeText();
    setText(text);
    setExposedVariable('text', text);
  }, [properties.text]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
  }, [disabledState]);

  useEffect(() => {
    const exposedVariables = {
      text: computeText(),
      setText: async function (text) {
        setText(text);
        setExposedVariable('text', text);
      },
      clear: async function () {
        setText('');
        setExposedVariable('text', '');
      },
      isVisible: properties.visibility,
      isLoading: loadingState,
      isDisabled: disabledState,
      visibility: async function (value) {
        setExposedVariable('isVisible', value);
        setVisibility(value);
      },
      setVisibility: async function (value) {
        setExposedVariable('isVisible', value);
        setVisibility(value);
      },
      setLoading: async function (value) {
        setExposedVariable('isLoading', value);
        setLoading(value);
      },
      setDisable: async function (value) {
        setExposedVariable('isDisabled', value);
        setIsDisabled(value);
      },
    };
    setExposedVariables(exposedVariables);
    setText(text);
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function computeText() {
    return properties.text === 0 || properties.text === false ? properties.text?.toString() : properties.text;
  }

  const handleClick = () => {
    fireEvent('onClick');
  };

  const computedStyles = {
    height: dynamicHeight ? 'auto' : `${height}px`,
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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: VERTICAL_ALIGNMENT_VS_CSS_VALUE[verticalAlignment],
    textAlign,
    ...(!dynamicHeight && {
      overflowX: isScrollRequired === 'disabled' && 'hidden',
      overflowY: isScrollRequired == 'enabled' ? 'auto' : 'hidden',
    }),
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
