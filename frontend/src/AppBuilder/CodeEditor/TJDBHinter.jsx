/* eslint-disable import/no-unresolved */
import React, { useEffect, useLayoutEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';

import ErrorBoundary from '@/_ui/ErrorBoundary';
import CodeHinter from './CodeHinter';
import _, { initial, noop } from 'lodash';
import { handleLowPriorityWork } from '@/_helpers/editorHelpers';
import { useMounted } from '@/_hooks/use-mount';
import toast from 'react-hot-toast';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const langSupport = Object.freeze({
  javascript: javascript(),
});

const TJDBCodeEditor = (props) => {
  const {
    darkMode,
    initialValue,
    lang,
    className,
    onChange,
    componentName,
    placeholder,

    portalProps,
    paramLabel = '',
    readOnly = false,
    editable = true,
    footerComponent = () => noop,
    errorCallback = () => noop,
    showErrorMessage = false,
    reset = false,
    defaultValue = null,
    shouldUpdateToNullVal = false,
    columnName = '',
  } = props;

  const mounted = useMounted();
  const [currentValue, setCurrentValue] = React.useState(() => initialValue);

  const [errorState, setErrorState] = React.useState(false);
  const [error, setError] = React.useState(null);

  const theme = darkMode ? okaidia : githubLight;
  const langExtention = langSupport[lang] ?? null;

  // eslint-disable-next-line react-hooks/exhaustive-deps

  const { handleTogglePopupExapand, isOpen, setIsOpen, forceUpdate } = portalProps;
  let cyLabel = paramLabel ? paramLabel.toLowerCase().trim().replace(/\s+/g, '-') : props.cyLabel;

  const handleOnChange = (value) => {
    if (value === '') {
      setErrorState(true);
      setError('JSON cannot be empty');
      setCurrentValue(value);
      return;
    }

    try {
      // Try to parse the value as JSON
      const parsedValue = JSON.parse(value);

      if (!_.isObject(parsedValue)) {
        setErrorState(true);
        setError('Expected a JSON object');
        throw new Error('');
      } else {
        setErrorState(false);
        setError(null);
      }
    } catch (err) {
      // If JSON parsing fails, it's not valid JSON
      setErrorState(true);
      setError('Invalid JSON');
    }

    setCurrentValue(value);
  };

  useEffect(() => {
    //hack : this use effect is for edit row drawer, on initial render, custom value was always ""
    if (!currentValue) setCurrentValue(initialValue);
  }, [initialValue]);

  useLayoutEffect(() => {
    if (mounted && reset && defaultValue) {
      handleLowPriorityWork(() => {
        setCurrentValue(JSON.stringify(defaultValue));
        if (errorState) {
          setErrorState(false);
          setError('');
          errorCallback(false);
        }
      });
    }
  }, [reset, defaultValue]);

  useLayoutEffect(() => {
    if (!mounted) return;
    if (shouldUpdateToNullVal) {
      handleLowPriorityWork(() => {
        setCurrentValue('null');
        if (errorState) {
          setErrorState(false);
          setError('');
          errorCallback(false);
        }
      });
    } else {
      !reset && handleLowPriorityWork(() => setCurrentValue(initialValue));
    }
  }, [shouldUpdateToNullVal]);

  useEffect(() => {
    if (reset || shouldUpdateToNullVal) return;
    onChange(currentValue);
  }, [currentValue]);

  useEffect(() => {
    errorCallback(errorState);
  }, [errorState]);

  useEffect(() => {
    if (className && className === 'has-empty-error') {
      setErrorState(true);
      setError('Cannot be empty');
    }
  }, [className]);

  const setupConfig = {
    lineNumbers: false,
    syntaxHighlighting: true,
    bracketMatching: true,
    foldGutter: false,
    highlightActiveLine: false,
    autocompletion: false,
    highlightActiveLineGutter: false,
    completionKeymap: false,
    searchKeymap: false,
  };

  return (
    <div
      className="cm-codehinter position-relative"
      style={{
        width: '100%',
        height: isOpen ? '350p' : 'auto',
      }}
    >
      <div className={`cm-codehinter  ${darkMode && 'cm-codehinter-dark-themed'}`}>
        <CodeHinter.PopupIcon
          callback={handleTogglePopupExapand}
          icon="portal-open"
          tip="Pop out code editor into a new window"
          isMultiEditor={false}
        />
        <CodeHinter.Portal
          isCopilotEnabled={false}
          isOpen={isOpen}
          callback={setIsOpen}
          componentName={componentName}
          key={componentName}
          forceUpdate={forceUpdate}
          optionalProps={{ styles: { height: 300 }, cls: '' }}
          darkMode={darkMode}
          selectors={{ className: 'preview-block-portal tjdb-portal-codehinter' }}
          dragResizePortal={true}
          callgpt={null}
        >
          <ErrorBoundary>
            <div className={`${errorState && 'tjdb-hinter-error'}`} data-cy={`${cyLabel}-input-field`}>
              <CodeMirror
                value={currentValue}
                placeholder={placeholder}
                height={isOpen ? '350px' : '32px'}
                maxHeight={'350px'}
                width="100%"
                theme={theme}
                extensions={[langExtention]}
                onChange={handleOnChange}
                basicSetup={setupConfig}
                style={{
                  overflowY: 'auto',
                  borderRadius: '4px',
                }}
                indentWithTab={true}
                readOnly={readOnly}
                editable={editable}
              />
            </div>
            <div
              className={`codehinter-error-container ${showErrorMessage && errorState ? 'd-block' : 'd-none'}`}
              style={{
                height: errorState ? 'auto' : '0px',
              }}
            >
              <span className="mx-2">
                {' '}
                <SolidIcon name="warning" width="16px" fill={'var(--tomato9)'} />
              </span>
              <span>{error}</span>
            </div>
            <div className={` ${isOpen ? 'd-block footer-component' : 'd-none'}`}>{footerComponent()}</div>
          </ErrorBoundary>
        </CodeHinter.Portal>
      </div>
    </div>
  );
};

export default TJDBCodeEditor;
