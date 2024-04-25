/* eslint-disable import/no-unresolved */
import React, { useEffect, useRef, useState } from 'react';
import { PreviewBox } from './PreviewBox';
import { ToolTip } from '@/Editor/Inspector/Elements/Components/ToolTip';
import { useTranslation } from 'react-i18next';
import { camelCase, isEmpty } from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import FxButton from '../CodeBuilder/Elements/FxButton';
import cx from 'classnames';
import { DynamicFxTypeRenderer } from './DynamicFxTypeRenderer';
import { resolveReferences } from './utils';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { getAutocompletion } from './autocompleteExtensionConfig';
import ErrorBoundary from '../ErrorBoundary';
import CodeHinter from './CodeHinter';

const SingleLineCodeEditor = ({ suggestions, componentName, fieldMeta = {}, ...restProps }) => {
  const { initialValue, onChange, enablePreview = true, portalProps } = restProps;
  const { validation = {} } = fieldMeta;

  const [isFocused, setIsFocused] = useState(false);
  const [currentValue, setCurrentValue] = useState('');
  const [errorStateActive, setErrorStateActive] = useState(false);
  const [cursorInsidePreview, setCursorInsidePreview] = useState(false);

  const isPreviewFocused = useRef(false);
  const wrapperRef = useRef(null);
  //! Re render the component when the componentName changes as the initialValue is not updated
  useEffect(() => {
    if (typeof initialValue !== 'string') return;
    setCurrentValue(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentName, initialValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cursorInsidePreview || portalProps?.isOpen || event.target.closest('.cm-tooltip-autocomplete')) {
        return;
      }

      if (wrapperRef.current && isFocused && !wrapperRef.current.contains(event.target)) {
        isPreviewFocused.current = false;
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapperRef, isFocused, isPreviewFocused, currentValue, portalProps?.isOpen, cursorInsidePreview]);

  const isWorkspaceVariable =
    typeof currentValue === 'string' && (currentValue.includes('%%client') || currentValue.includes('%%server'));
  return (
    <div
      ref={wrapperRef}
      className="code-hinter-wrapper position-relative"
      style={{ width: '100%', height: restProps?.lang === 'jsx' && '320px' }}
    >
      <PreviewBox.Container
        enablePreview={enablePreview}
        currentValue={currentValue}
        isFocused={isFocused}
        setCursorInsidePreview={setCursorInsidePreview}
        componentName={componentName}
        validationSchema={validation}
        setErrorStateActive={setErrorStateActive}
        ignoreValidation={restProps?.ignoreValidation || isEmpty(validation)}
        componentId={restProps?.componentId ?? null}
        isWorkspaceVariable={isWorkspaceVariable}
        errorStateActive={errorStateActive}
        previewPlacement={restProps?.cyLabel === 'canvas-bg-colour' ? 'top' : 'left-start'}
        type={restProps?.type}
      >
        <div className="code-editor-basic-wrapper d-flex">
          <div className="codehinter-container w-100">
            <SingleLineCodeEditor.Editor
              currentValue={currentValue}
              setCurrentValue={setCurrentValue}
              hints={suggestions}
              isFocused={isFocused}
              setFocus={setIsFocused}
              validationType={validation?.schema?.type}
              onBlurUpdate={onChange}
              error={errorStateActive}
              cyLabel={restProps.cyLabel}
              portalProps={portalProps}
              componentName={componentName}
              {...restProps}
            />
          </div>
        </div>
      </PreviewBox.Container>
    </div>
  );
};

const EditorInput = ({
  currentValue,
  setCurrentValue,
  hints,
  setFocus,
  validationType,
  onBlurUpdate,
  placeholder = '',
  error,
  cyLabel,
  componentName,
  usePortalEditor = true,
  renderPreview,
  portalProps,
  ignoreValidation,
  lang,
  isFocused,
  componentId,
  type,
}) => {
  function autoCompleteExtensionConfig(context) {
    let word = context.matchBefore(/\w*/);

    const totalReferences = (context.state.doc.toString().match(/{{/g) || []).length;

    let queryInput = context.state.doc.toString();

    if (totalReferences > 0) {
      const currentCursor = context.state.selection.main.head;
      const currentCursorPos = context.pos;

      let currentWord = queryInput.substring(currentCursor, currentCursorPos);

      if (currentWord?.length === 0) {
        const lastBracesFromPos = queryInput.lastIndexOf('{{', currentCursorPos);
        currentWord = queryInput.substring(lastBracesFromPos, currentCursorPos);
        //remove curly braces from the current word as will append it later
        currentWord = currentWord.replace(/{{|}}/g, '');
      }

      // remove \n from the current word if it is present
      currentWord = currentWord.replace(/\n/g, '');

      queryInput = '{{' + currentWord + '}}';
    }

    let completions = getAutocompletion(queryInput, validationType, hints, totalReferences);

    return {
      from: word.from,
      options: completions,
      validFor: /^\{\{.*\}\}$/,
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const overRideFunction = React.useCallback((context) => autoCompleteExtensionConfig(context), [hints]);

  const autoCompleteConfig = autocompletion({
    override: [overRideFunction],
    compareCompletions: (a, b) => {
      return a.label < b.label ? -1 : 1;
    },
    aboveCursor: false,
    defaultKeymap: true,
  });

  const customKeyMaps = [...defaultKeymap, ...completionKeymap];

  const handleOnChange = React.useCallback((val) => {
    setCurrentValue(val);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOnBlur = () => {
    if (ignoreValidation) {
      return onBlurUpdate(currentValue);
    }
    setTimeout(() => {
      setFirstTimeFocus(false);
      if (!error || currentValue == '') {
        const _value = currentValue;
        onBlurUpdate(_value);
      }
    }, 0);
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const theme = darkMode ? okaidia : githubLight;

  const { handleTogglePopupExapand, isOpen, setIsOpen, forceUpdate } = portalProps;

  const [firstTimeFocus, setFirstTimeFocus] = useState(false);

  const customClassNames = cx('codehinter-input', {
    'border-danger': error,
    focused: isFocused,
    'focus-box-shadow-active': firstTimeFocus,
    'widget-code-editor': componentId,
  });

  const currentEditorHeightRef = useRef(null);

  const handleFocus = () => {
    setFirstTimeFocus(true);
    setTimeout(() => {
      setFocus(true);
    }, 50);
  };

  const showLineNumbers = lang == 'jsx' || type === 'extendedSingleLine' || false;

  return (
    <div
      ref={currentEditorHeightRef}
      className={`cm-codehinter ${darkMode && 'cm-codehinter-dark-themed'}`}
      cyLabel={cyLabel}
    >
      {usePortalEditor && (
        <CodeHinter.PopupIcon
          callback={handleTogglePopupExapand}
          icon="portal-open"
          tip="Pop out code editor into a new window"
          position={currentEditorHeightRef?.current?.getBoundingClientRect()}
        />
      )}
      <CodeHinter.Portal
        isCopilotEnabled={false}
        isOpen={isOpen}
        callback={setIsOpen}
        componentName={componentName}
        key={componentName}
        customComponent={renderPreview}
        forceUpdate={forceUpdate}
        optionalProps={{ styles: { height: 300 }, cls: '' }}
        darkMode={darkMode}
        selectors={{ className: 'preview-block-portal' }}
        dragResizePortal={true}
        callgpt={null}
      >
        <ErrorBoundary>
          <CodeMirror
            value={currentValue}
            placeholder={placeholder}
            height={showLineNumbers ? '400px' : '100%'}
            width="100%"
            extensions={[javascript({ jsx: lang === 'jsx' }), autoCompleteConfig, keymap.of([...customKeyMaps])]}
            onChange={(val) => {
              setFirstTimeFocus(false);
              handleOnChange(val);
            }}
            basicSetup={{
              lineNumbers: showLineNumbers,
              syntaxHighlighting: true,
              bracketMatching: true,
              foldGutter: false,
              highlightActiveLine: false,
              autocompletion: true,
              completionKeymap: true,
              searchKeymap: false,
            }}
            onFocus={() => handleFocus()}
            onBlur={() => handleOnBlur()}
            className={customClassNames}
            theme={theme}
            indentWithTab={true}
          />
        </ErrorBoundary>
      </CodeHinter.Portal>
    </div>
  );
};

const DynamicEditorBridge = (props) => {
  const {
    initialValue,
    type,
    fxActive,
    paramType,
    paramLabel,
    paramName,
    fieldMeta,
    darkMode,
    className,
    onFxPress,
    cyLabel = '',
    onChange,
    styleDefinition,
  } = props;

  const [forceCodeBox, setForceCodeBox] = React.useState(fxActive);
  const codeShow = paramType === 'code' || forceCodeBox;
  const HIDDEN_CODE_HINTER_LABELS = ['Table data', 'Column data', 'Text Format'];
  const { isFxNotRequired } = fieldMeta;
  const { t } = useTranslation();
  const [_, error, value] = type === 'fxEditor' ? resolveReferences(initialValue) : [];

  return (
    <div className={cx({ 'codeShow-active': codeShow }, 'wrapper-div-code-editor')}>
      <div className={cx('d-flex align-items-center justify-content-between')}>
        {paramLabel !== ' ' && !HIDDEN_CODE_HINTER_LABELS.includes(paramLabel) && (
          <div className={`field ${className}`} data-cy={`${cyLabel}-widget-parameter-label`}>
            <ToolTip
              label={t(`widget.commonProperties.${camelCase(paramLabel)}`, paramLabel)}
              meta={fieldMeta}
              labelClass={`tj-text-xsm color-slate12 ${codeShow ? 'mb-2' : 'mb-0'} ${
                darkMode && 'color-whitish-darkmode'
              }`}
            />
          </div>
        )}
        <div className={`${(paramType ?? 'code') === 'code' ? 'd-none' : ''} flex-grow-1`}>
          <div
            style={{ marginBottom: codeShow ? '0.5rem' : '0px' }}
            className="d-flex align-items-center justify-content-end "
          >
            {paramLabel !== 'Type' && isFxNotRequired === undefined && (
              <div className="col-auto pt-0 fx-common fx-button-container">
                <FxButton
                  active={codeShow}
                  onPress={() => {
                    if (codeShow) {
                      setForceCodeBox(false);
                      onFxPress(false);
                    } else {
                      setForceCodeBox(true);
                      onFxPress(true);
                    }
                  }}
                  dataCy={cyLabel}
                />
              </div>
            )}

            {!codeShow && (
              <DynamicFxTypeRenderer
                value={!error ? value : ''}
                onChange={onChange}
                paramName={paramName}
                paramLabel={paramLabel}
                paramType={paramType}
                forceCodeBox={() => {
                  setForceCodeBox(true);
                  onFxPress(true);
                }}
                meta={fieldMeta}
                cyLabel={cyLabel}
                styleDefinition={styleDefinition}
              />
            )}
          </div>
        </div>
      </div>
      {codeShow && (
        <div className={`row custom-row`} style={{ display: codeShow ? 'flex' : 'none' }}>
          <div className={`col code-hinter-col`}>
            <div className="d-flex">
              <SingleLineCodeEditor initialValue {...props} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

SingleLineCodeEditor.Editor = EditorInput;
SingleLineCodeEditor.EditorBridge = DynamicEditorBridge;

export default SingleLineCodeEditor;
