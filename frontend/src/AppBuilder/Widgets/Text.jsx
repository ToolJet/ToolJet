import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
// eslint-disable-next-line import/no-unresolved
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import './text.scss';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/displayA';

const VERTICAL_ALIGNMENT_VS_CSS_VALUE = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
};

export const Text = function Text({
  id,
  height,
  width,
  properties,
  fireEvent,
  styles,
  darkMode,
  setExposedVariables,
  dataCy,
  currentLayout,
  currentMode,
  subContainerIndex,
  componentType,
  moduleId,
  resolveIndex,
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
  const { loadingState, textFormat, disabledState } = properties;
  const color = ['#000', '#000000'].includes(textColor) ? (darkMode ? '#fff' : '#000') : textColor;
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';

  /* ── Controlled reads: store is the source of truth ───────────────────── */
  const exposedOpts = { resolveIndex, moduleId };
  const text = useExposedVariable(id, 'text', exposedOpts, computeText());
  const visibility = useExposedVariable(id, 'isVisible', exposedOpts, properties.visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);

  const { csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Create ref for height observation
  const textRef = useRef(null);
  const heightChangeValue = useHeightObserver(textRef, isDynamicHeightEnabled);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    currentLayout,
    width,
    visibility,
    subContainerIndex,
    componentType,
  });

  /* ── Property-change write-throughs (skip-initial) ────────────────────── */
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ text: computeText() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.text]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isVisible: properties.visibility });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isLoading: loadingState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isDisabled: disabledState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  /* ── Mount snapshot: initial exposed values + contract CSA dispatchers
     (setText/clear/setVisibility/setLoading/setDisable + the deprecated
     `visibility` alias) ─────────────────────────────────────────────────── */
  useEffect(() => {
    setExposedVariables({
      text: computeText(),
      isVisible: properties.visibility,
      isLoading: loadingState,
      isDisabled: disabledState,
      ...csaShims(),
    });
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
    ...(isDynamicHeightEnabled && { minHeight: `${height}px` }),
    height: isDynamicHeightEnabled ? 'auto' : `${height}px`,
    backgroundColor: darkMode && ['#edeff5'].includes(backgroundColor) ? '#2f3c4c' : backgroundColor,
    color,
    display: visibility ? 'flex' : 'none',
    fontWeight: fontWeight ? fontWeight : fontWeight === '0' ? 0 : 'normal',
    lineHeight: lineHeight ?? 1.5,
    textDecoration: decoration ?? 'none',
    textTransform: transformation ?? 'none',
    fontStyle: fontStyle ?? 'none',
    fontVariant: fontVariant ?? 'normal',
    // eslint-disable-next-line no-constant-binary-expression
    textIndent: `${textIndent}px` ?? '0px',
    // eslint-disable-next-line no-constant-binary-expression
    letterSpacing: `${letterSpacing}px` ?? '0px',
    // eslint-disable-next-line no-constant-binary-expression
    wordSpacing: `${wordSpacing}px` ?? '0px',
    boxShadow,
    border: '1px solid',
    borderColor: darkMode && ['#f2f2f5'].includes(borderColor) ? '#2f3c4c' : borderColor ? borderColor : 'transparent',
    borderRadius: borderRadius ? `${borderRadius}px` : '0px',
    fontSize: `${textSize}px`,
  };

  const commonStyles = {
    width: '100%',
    ...(isDynamicHeightEnabled ? { minHeight: `${height}px` } : { height: '100%' }),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: VERTICAL_ALIGNMENT_VS_CSS_VALUE[verticalAlignment],
    textAlign,
    ...(!isDynamicHeightEnabled && {
      overflowX: isScrollRequired === 'disabled' && 'hidden',
      overflowY: isScrollRequired == 'enabled' ? 'auto' : 'hidden',
    }),
  };

  const commonScrollStyle = {
    overflowY: isScrollRequired == 'enabled' ? 'auto' : 'hidden',
  };

  return (
    <div
      ref={textRef}
      data-disabled={isDisabled}
      className="text-widget"
      style={computedStyles}
      data-cy={`${generateCypressDataCy(dataCy)}-text`}
      onMouseOver={() => {
        fireEvent('onHover');
      }}
      onClick={handleClick}
    >
      {!isLoading && (
        <div style={commonStyles} className="text-widget-section">
          {textFormat === 'plainText' && (
            <div style={commonScrollStyle}>{typeof text === 'object' ? JSON.stringify(text) : text}</div>
          )}
          {textFormat === 'markdown' && (
            <div style={commonScrollStyle}>
              <Markdown className={'reactMarkdown'} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {typeof text === 'object' ? JSON.stringify(text) : text}
              </Markdown>
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
