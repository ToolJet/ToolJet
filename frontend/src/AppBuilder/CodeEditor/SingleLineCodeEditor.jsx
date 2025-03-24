/* eslint-disable import/no-unresolved */
import React, { useEffect, useRef, useState } from 'react';
import { PreviewBox } from './PreviewBox';
import { ToolTip } from '@/Editor/Inspector/Elements/Components/ToolTip';
import { useTranslation } from 'react-i18next';
import { camelCase, isEmpty, noop } from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion, completionKeymap, completionStatus, acceptCompletion } from '@codemirror/autocomplete';
import { defaultKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import FxButton from '../CodeBuilder/Elements/FxButton';
import cx from 'classnames';
import { DynamicFxTypeRenderer } from './DynamicFxTypeRenderer';
import { resolveReferences } from './utils';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { getAutocompletion } from './autocompleteExtensionConfig';
import ErrorBoundary from '@/_ui/ErrorBoundary';
import CodeHinter from './CodeHinter';
// import { EditorContext } from '../Context/EditorContextWrapper';
import { removeNestedDoubleCurlyBraces } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useQueryPanelKeyHooks } from './useQueryPanelKeyHooks';

const SingleLineCodeEditor = ({ componentName, fieldMeta = {}, componentId, ...restProps }) => {
  const { initialValue, onChange, enablePreview = true, portalProps } = restProps;
  const { validation = {} } = fieldMeta;
  const [showPreview, setShowPreview] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [currentValue, setCurrentValue] = useState('');
  const [errorStateActive, setErrorStateActive] = useState(false);
  const [cursorInsidePreview, setCursorInsidePreview] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const validationFn = restProps?.validationFn;
  const componentDefinition = useStore((state) => state.getComponentDefinition(componentId), shallow);
  const parentId = componentDefinition?.component?.parent;
  const customResolvables = useStore((state) => state.resolvedStore.modules.canvas?.customResolvables, shallow);

  const customVariables = customResolvables?.[parentId]?.[0] || {};

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 1) {
          setShowPreview(false);
          setShowSuggestions(false);
        } else {
          setShowSuggestions(true);
        }
      },
      { root: null, threshold: [1] } // Fires when any part of the element is out of view
    );

    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }

    return () => {
      if (wrapperRef.current) {
        observer.unobserve(wrapperRef.current);
      }
    };
  }, []);

  const isPreviewFocused = useRef(false);
  const wrapperRef = useRef(null);

  const replaceIdsWithName = useStore((state) => state.replaceIdsWithName, shallow);
  let newInitialValue = initialValue;

  if (typeof initialValue === 'string' && (initialValue?.includes('components') || initialValue?.includes('queries'))) {
    newInitialValue = replaceIdsWithName(initialValue);
  }
  //! Re render the component when the componentName changes as the initialValue is not updated

  // const { variablesExposedForPreview } = useContext(EditorContext) || {};

  // const customVariables = variablesExposedForPreview?.[componentId] ?? {};

  useEffect(() => {
    if (typeof newInitialValue !== 'string') return;

    // const [valid, _error] = !isEmpty(validation)
    //   ? resolveReferences(newInitialValue, validation, customVariables)
    //   : [true, null];

    //!TODO use the updated new resolver
    const [valid, _error] =
      !isEmpty(validation) || validationFn
        ? resolveReferences(newInitialValue, validation, customVariables, validationFn)
        : [true, null];

    setErrorStateActive(!valid);

    setCurrentValue(newInitialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentName, newInitialValue, validationFn]);

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

  const previewRef = useRef(null);

  return (
    <div
      ref={wrapperRef}
      className="code-hinter-wrapper position-relative"
      style={{ width: '100%', height: restProps?.lang === 'jsx' && '320px' }}
    >
      <PreviewBox.Container
        previewRef={previewRef}
        showPreview={showPreview}
        customVariables={customVariables}
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
        isPortalOpen={restProps?.portalProps?.isOpen}
        validationFn={validationFn}
      >
        <div className="code-editor-basic-wrapper d-flex">
          <div className="codehinter-container w-100">
            <SingleLineCodeEditor.Editor
              previewRef={previewRef}
              currentValue={currentValue}
              setCurrentValue={setCurrentValue}
              isFocused={isFocused}
              setFocus={setIsFocused}
              validationType={validation?.schema?.type}
              onBlurUpdate={onChange}
              error={errorStateActive}
              cyLabel={restProps.cyLabel}
              portalProps={portalProps}
              componentName={componentName}
              setShowPreview={setShowPreview}
              showPreview={showPreview}
              showSuggestions={showSuggestions}
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
  setFocus,
  validationType,
  onBlurUpdate,
  placeholder = '',
  error,
  cyLabel = '',
  componentName,
  usePortalEditor = true,
  renderPreview,
  portalProps,
  lang,
  isFocused,
  componentId,
  type,
  delayOnChange = true, // Added this prop to immediately update the onBlurUpdate callback
  paramLabel = '',
  disabled = false,
  previewRef,
  setShowPreview,
  onInputChange,
  showSuggestions,
}) => {
  const getSuggestions = useStore((state) => state.getSuggestions, shallow);
  const { queryPanelKeybindings } = useQueryPanelKeyHooks(onBlurUpdate, currentValue, 'singleline');

  function autoCompleteExtensionConfig(context) {
    const hints = getSuggestions();
    let word = context.matchBefore(/\w*/);

    const totalReferences = (context.state.doc.toString().match(/{{/g) || []).length;

    let queryInput = context.state.doc.toString();
    const originalQueryInput = queryInput;

    if (totalReferences > 0) {
      const currentCursor = context.state.selection.main.head;
      const currentCursorPos = context.pos;

      let currentWord = queryInput.substring(currentCursor, currentCursorPos);

      if (currentWord?.length === 0) {
        const lastBracesFromPos = queryInput.lastIndexOf('{{', currentCursorPos);
        currentWord = queryInput.substring(lastBracesFromPos, currentCursorPos);
        //remove curly braces from the current word as will append it later
        currentWord = removeNestedDoubleCurlyBraces(currentWord);
      }

      if (currentWord.includes(' ')) {
        currentWord = currentWord.split(' ').pop();
      }

      // remove \n from the current word if it is present
      currentWord = currentWord.replace(/\n/g, '');

      queryInput = '{{' + currentWord + '}}';
    }

    let completions = getAutocompletion(queryInput, validationType, hints, totalReferences, originalQueryInput);

    return {
      from: word.from,
      options: completions,
      validFor: /^\{\{.*\}\}$/,
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const overRideFunction = React.useCallback((context) => autoCompleteExtensionConfig(context), []);

  const autoCompleteConfig = autocompletion({
    override: [overRideFunction],
    compareCompletions: (a, b) => {
      return a.section.rank - b.section.rank && a.label.localeCompare(b.label);
    },
    aboveCursor: false,
    defaultKeymap: true,
    positionInfo: () => {
      return {
        class: 'cm-completionInfo-top cm-custom-completion-info cm-custom-singleline-completion-info',
      };
    },
    maxRenderedOptions: 10,
  });

  const customKeyMaps = [
    ...defaultKeymap.filter((keyBinding) => keyBinding.key !== 'Mod-Enter'), // Remove default keybinding for Mod-Enter
    ...completionKeymap,
  ];
  const customTabKeymap = keymap.of([
    {
      key: 'Tab',
      run: (view) => {
        if (completionStatus(view.state)) {
          return acceptCompletion(view);
        }
        if (isOpen) {
          const { state } = view;
          const { selection } = state;
          const { anchor } = selection.main;
          const tabSize = 2;

          view?.dispatch({
            changes: { from: anchor, insert: ' '.repeat(tabSize) },
            selection: { anchor: anchor + tabSize },
          });
          return true;
        }
      },
    },
    ...queryPanelKeybindings,
  ]);

  const handleOnChange = React.useCallback((val) => {
    setCurrentValue(val);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOnBlur = () => {
    setShowPreview(false);
    if (!delayOnChange) {
      setFirstTimeFocus(false);
      return onBlurUpdate(currentValue);
    }
    setTimeout(() => {
      setFirstTimeFocus(false);
      onBlurUpdate(currentValue);
    }, 0);
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const theme = darkMode ? okaidia : githubLight;

  const { handleTogglePopupExapand, isOpen, setIsOpen, forceUpdate } = portalProps;
  // when full screen editor is closed, show the preview box
  useEffect(() => {
    if (isFocused && !isOpen) {
      setShowPreview(true);
    }
  }, [isOpen, isFocused]);

  const [firstTimeFocus, setFirstTimeFocus] = useState(false);
  const currentEditorHeightRef = useRef(null);
  const isInsideQueryPane = !!currentEditorHeightRef?.current?.closest('.query-details');
  const showLineNumbers = lang == 'jsx' || type === 'extendedSingleLine' || false;

  const customClassNames = cx('codehinter-input single-line-codehinter-input', {
    'border-danger': error,
    focused: isFocused,
    'focus-box-shadow-active': firstTimeFocus,
    'widget-code-editor': componentId,
    'disabled-pointerevents': disabled,
    'code-editor-query-panel': isInsideQueryPane,
    'show-line-numbers': showLineNumbers,
  });

  const handleFocus = () => {
    setFirstTimeFocus(true);
    setTimeout(() => {
      setFocus(true);
    }, 50);
  };

  // in query panel we are allowing code editor to have dynamic height, this observer is to show/hide preview box based on the visibility of the editor
  useEffect(() => {
    if (!isInsideQueryPane) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && isFocused) {
          setShowPreview(true);
        } else {
          setShowPreview(false);
        }
      },
      {
        root: document.querySelector('.query-details'),
        threshold: 0.01,
      }
    );
    if (currentEditorHeightRef.current) {
      observer.observe(currentEditorHeightRef.current);
    }

    return () => {
      if (currentEditorHeightRef.current) {
        observer.unobserve(currentEditorHeightRef.current);
      }
    };
  }, [isInsideQueryPane, isFocused]);

  cyLabel = paramLabel ? paramLabel.toLowerCase().trim().replace(/\s+/g, '-') : cyLabel;

  return (
    <div
      ref={currentEditorHeightRef}
      className={`cm-codehinter ${darkMode && 'cm-codehinter-dark-themed'} ${disabled ? 'disabled-cursor' : ''}`}
      data-cy={`${cyLabel.replace(/_/g, '-')}-input-field`}
    >
      {/* sticky element to position the preview box correctly on top without flowing out of container */}
      {usePortalEditor && (
        <CodeHinter.PopupIcon
          callback={handleTogglePopupExapand}
          icon="portal-open"
          tip="Pop out code editor into a new window"
          position={currentEditorHeightRef?.current?.getBoundingClientRect()}
          isQueryManager={isInsideQueryPane}
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
          <div
            style={{
              position: 'relative',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
            className="check-here"
            ref={previewRef}
          >
            <CodeMirror
              value={currentValue}
              placeholder={placeholder}
              height={isInsideQueryPane ? '100%' : showLineNumbers ? '400px' : '100%'}
              width="100%"
              extensions={
                showSuggestions
                  ? [
                      javascript({ jsx: lang === 'jsx' }),
                      autoCompleteConfig,
                      keymap.of([...customKeyMaps]),
                      customTabKeymap,
                    ]
                  : [javascript({ jsx: lang === 'jsx' })]
              }
              onChange={(val) => {
                setFirstTimeFocus(false);
                handleOnChange(val);
                onInputChange && onInputChange(val);
              }}
              basicSetup={{
                lineNumbers: showLineNumbers,
                syntaxHighlighting: true,
                bracketMatching: true,
                foldGutter: false,
                highlightActiveLine: false,
                autocompletion: true,
                defaultKeymap: false,
                completionKeymap: true,
                searchKeymap: false,
              }}
              onMouseDown={() => handleFocus()}
              onBlur={() => handleOnBlur()}
              className={customClassNames}
              theme={theme}
              indentWithTab={false}
              readOnly={disabled}
            />
          </div>
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
    paramType = 'code',
    paramLabel,
    paramName,
    fieldMeta,
    darkMode,
    className,
    onFxPress = noop,
    onChange,
    styleDefinition,
    component,
    onVisibilityChange,
    isEventManagerParam = false,
  } = props;

  const [forceCodeBox, setForceCodeBox] = React.useState(fxActive);
  const codeShow = paramType === 'code' || forceCodeBox;
  const HIDDEN_CODE_HINTER_LABELS = ['Table data', 'Column data', 'Text Format'];
  const { isFxNotRequired } = fieldMeta;
  const { t } = useTranslation();
  const [_, error, value] = type === 'fxEditor' ? resolveReferences(initialValue) : [];
  let cyLabel = paramLabel ? paramLabel.toLowerCase().trim().replace(/\s+/g, '-') : props.cyLabel;

  useEffect(() => {
    setForceCodeBox(fxActive);
  }, [component, fxActive]);

  const fxClass = isEventManagerParam ? 'justify-content-start' : 'justify-content-end';
  return (
    <div className={cx({ 'codeShow-active': codeShow }, 'wrapper-div-code-editor')}>
      <div className={cx('d-flex align-items-center justify-content-between code-flex-wrapper')}>
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
          <div style={{ marginBottom: codeShow ? '0.5rem' : '0px' }} className={`d-flex align-items-center ${fxClass}`}>
            {paramLabel !== 'Type' && isFxNotRequired === undefined && (
              <div
                className={`col-auto pt-0 fx-common fx-button-container ${
                  (isEventManagerParam || codeShow) && 'show-fx-button-container'
                }`}
              >
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
          </div>
        </div>
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
            component={component}
            onVisibilityChange={onVisibilityChange}
          />
        )}
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
