# Fix for Issue #6655: incorrect code-hinter header text

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSpring, config, animated } from 'react-spring';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { autocompletion } from '@codemirror/autocomplete';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { duotoneLight, duotoneDark } from '@uiw/codemirror-theme-duotone';
import { useCurrentState } from '@/_stores/currentStateStore';
import { getSuggestionKeys } from './utils';
import PortalTooltip from './PortalTooltip';
import PreviewBox from './PreviewBox';
import { Color } from './Color';
import FxButton from './FxButton';
import cx from 'classnames';
import { resolveReferences } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import { useShallow } from 'zustand/react/shallow';

const CodeHinter = (props) => {
  const {
    initialValue,
    onChange,
    mode = 'javascript',
    theme = 'default',
    lineNumbers = true,
    placeholder = '',
    componentName = null,
    type = 'basic',
    paramLabel = '',
    paramName = '',
    fieldMeta = {},
    onFxPress = null,
    fxActive = false,
    component = null,
    cyLabel = '',
    callgpt = null,
    isCopilotEnabled = false,
    currentLayout = 'desktop',
  } = props;

  const currentState = useCurrentState();
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [heightRef, setHeightRef] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isPreviewLoading = useStore(useShallow((state) => state.isPreviewLoading));

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const slide = useSpring({
    height: heightRef ? (isExpanded ? 'auto' : '0px') : '0px',
    overflow: 'hidden',
    config: { ...config.stiff },
  });

  useEffect(() => {
    setCurrentValue(initialValue);
  }, [initialValue]);

  const handleChange = (val) => {
    setCurrentValue(val);
    onChange(val);
  };

  const getTheme = () => {
    switch (theme) {
      case 'github-dark':
        return githubDark;
      case 'github-light':
        return githubLight;
      case 'okaidia':
        return okaidia;
      case 'duotone-light':
        return duotoneLight;
      case 'duotone-dark':
        return duotoneDark;
      default:
        return githubLight;
    }
  };

  const getLanguageExtension = () => {
    switch (mode) {
      case 'python':
        return python();
      default:
        return javascript({ jsx: true });
    }
  };

  const suggestions = useMemo(() => {
    return getSuggestionKeys(currentState);
  }, [currentState]);

  const completionSource = (context) => {
    const word = context.matchBefore(/\w*/);
    if (word.from === word.to && !context.explicit) return null;

    return {
      from: word.from,
      options: suggestions.map((s) => ({ label: s, type: 'variable' })),
    };
  };

  const extensions = [
    getLanguageExtension(),
    autocompletion({
      override: [completionSource],
    }),
  ];

  const handleFocus = () => {
    setIsFocused(true);
    setHeightRef(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const renderTypeIcon = () => {
    if (type === 'fxEditor' && onFxPress) {
      return <FxButton active={fxActive} onPress={onFxPress} />;
    }
    return null;
  };

  const renderExpandIcon = () => (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id="expand-tooltip">{isExpanded ? 'Collapse' : 'Expand'}</Tooltip>}
    >
      <span className="codehinter-expand-icon" onClick={toggleExpand}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.5 1.5C7.5 1.22386 7.72386 1 8 1H10.5C10.7761 1 11 1.22386 11 1.5V4C11 4.27614 10.7761 4.5 10.5 4.5C10.2239 4.5 10 4.27614 10 4V2.70711L7.35355 5.35355C7.15829 5.54882 6.84171 5.54882 6.64645 5.35355C6.45118 5.15829 6.45118 4.84171 6.64645 4.64645L9.29289 2H8C7.72386 2 7.5 1.77614 7.5 1.5ZM1.5 7.5C1.77614 7.5 2 7.72386 2 8V9.29289L4.64645 6.64645C4.84171 6.45118 5.15829 6.45118 5.35355 6.64645C5.54882 6.84171 5.54882 7.15829 5.35355 7.35355L2.70711 10H4C4.27614 10 4.5 10.2239 4.5 10.5C4.5 10.7761 4.27614 11 4 11H1.5C1.22386 11 1 10.7761 1 10.5V8C1 7.72386 1.22386 7.5 1.5 7.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
    </OverlayTrigger>
  );

  const renderCodeEditor = (height = 'auto', minHeight = '36px', expandedMode = false) => (
    <CodeMirror
      ref={inputRef}
      value={currentValue}
      height={height}
      minHeight={minHeight}
      theme={getTheme()}
      extensions={extensions}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      basicSetup={{
        lineNumbers: expandedMode ? lineNumbers : false,
        foldGutter: expandedMode,
        dropCursor: true,
        allowMultipleSelections: true,
        indentOnInput: true,
      }}
      className={cx('codehinter-input', { 'codehinter-input-focused': isFocused })}
    />
  );

  if (isExpanded) {
    return (
      <PortalTooltip
        isOpen={isExpanded}
        onClose={toggleExpand}
        darkMode={darkMode}
        title={paramLabel || 'Editor'}
        component={component}
        componentName={componentName}
        currentLayout={currentLayout}
        callgpt={callgpt}
        isCopilotEnabled={isCopilotEnabled}
      >
        <div className="codehinter-expanded-content">
          {renderCodeEditor('300px', '300px', true)}
          <PreviewBox currentValue={currentValue} currentState={currentState} isLoading={isPreviewLoading} />
        </div>
      </PortalTooltip>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={cx('codehinter-wrapper', {
        'codehinter-focused': isFocused,
      })}
      data-cy={cyLabel}
    >
      <div className="codehinter-container">
        <div className="codehinter-input-wrapper">{renderCodeEditor()}</div>
        <div className="codehinter-actions">
          {renderTypeIcon()}
          {renderExpandIcon()}
        </div>
      </div>
      <animated.div style={slide}>
        {heightRef && (
          <PreviewBox currentValue={currentValue} currentState={currentState} isLoading={isPreviewLoading} />
        )}
      </animated.div>
    </div>
  );
};

export default CodeHinter;