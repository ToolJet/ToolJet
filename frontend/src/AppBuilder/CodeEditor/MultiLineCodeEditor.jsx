// frontend/src/AppBuilder/CodeEditor/MultiLineCodeEditor.jsx
/* eslint-disable import/no-unresolved */
import React, { useContext, useEffect, useRef, useState, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { defaultKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { completionKeymap, acceptCompletion, autocompletion, completionStatus } from '@codemirror/autocomplete';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { sass, sassCompletionSource } from '@codemirror/lang-sass';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { findNearestSubstring, generateHints } from './autocompleteExtensionConfig';
import ErrorBoundary from '@/_ui/ErrorBoundary';
import CodeHinter from './CodeHinter';
import { CodeHinterContext } from '../CodeBuilder/CodeHinterContext';
import { createReferencesLookup } from '@/_stores/utils';
import { PreviewBox } from './PreviewBox';
import { removeNestedDoubleCurlyBraces } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { search, searchKeymap, searchPanelOpen } from '@codemirror/search';
import { handleSearchPanel, SearchBtn } from './SearchBox';

const langSupport = Object.freeze({
  javascript: javascript(),
  python: python(),
  sql: sql(),
  jsx: javascript({ jsx: true }),
  css: sass(),
});

const MultiLineCodeEditor = (props) => {
  const {
    darkMode,
    height,
    initialValue,
    lang,
    className,
    onChange,
    componentName,
    lineNumbers,
    placeholder,
    hideSuggestion,
    portalProps,
    showPreview,
    paramLabel = '',
    delayOnChange = true,
    readOnly = false,
    editable = true,
    renderCopilot,
  } = props;

  const replaceIdsWithName = useStore((state) => state.replaceIdsWithName, shallow);
  const getSuggestions = useStore((state) => state.getSuggestions, shallow);
  const isInsideQueryPane = !!document.querySelector('.code-hinter-wrapper')?.closest('.query-details');

  const context = useContext(CodeHinterContext);
  const { suggestionList } = createReferencesLookup(context, true);
  const currentValueRef = useRef(initialValue);
  const [editorView, setEditorView] = useState(null);

  const handleChange = (val) => (currentValueRef.current = val);
  const handleOnBlur = () => {
    if (!delayOnChange) return onChange(currentValueRef.current);
    setTimeout(() => onChange(currentValueRef.current), 100);
  };

  const heightInPx = typeof height === 'string' && height.includes('px') ? height : `${height}px`;
  const theme = darkMode ? okaidia : githubLight;
  const langExtension = langSupport[lang] ?? null;

  const setupConfig = {
    lineNumbers: lineNumbers ?? true,
    syntaxHighlighting: true,
    bracketMatching: true,
    foldGutter: true,
    highlightActiveLine: false,
    autocompletion: hideSuggestion ?? true,
    completionKeymap: true,
    searchKeymap: false,
  };

  function autoCompleteExtensionConfig(context) {
    // existing logic...
  }

  const customKeyMaps = [...defaultKeymap, ...completionKeymap, ...searchKeymap];
  const customTabKeymap = keymap.of([{ /* ... */ }]);
  const overRideFunction = React.useCallback((ctx) => autoCompleteExtensionConfig(ctx), []);
  const { handleTogglePopupExapand, isOpen, setIsOpen, forceUpdate } = portalProps;
  let cyLabel = paramLabel ? paramLabel.toLowerCase().trim().replace(/\s+/g, '-') : props.cyLabel;

  const initialValueWithReplacedIds = useMemo(() => {
    if (typeof initialValue === 'string' && (initialValue.includes('components') || initialValue.includes('queries'))) {
      return replaceIdsWithName(initialValue);
    }
    return initialValue;
  }, [initialValue, replaceIdsWithName]);

  return (
    <div
      className={`code-hinter-wrapper position-relative ${isInsideQueryPane ? 'code-editor-query-panel' : ''}`}
      style={{ width: '100%' }}
    >
      <div className={`${className} ${darkMode && 'cm-codehinter-dark-themed'}`}>
        <SearchBtn view={editorView} />
        <CodeHinter.PopupIcon
          callback={handleTogglePopupExapand}
          icon="portal-open"
          tip="Pop out code editor into a new window"
          isMultiEditor={true}
          isQueryManager={isInsideQueryPane}
        />
        {renderCopilot && renderCopilot()}

        <CodeHinter.Portal
          isCopilotEnabled={false}
          isOpen={isOpen}
          callback={setIsOpen}
          componentName={componentName}
          title={componentName || 'Editor'}
          key={componentName}
          forceUpdate={forceUpdate}
          optionalProps={{ styles: { height: 300 }, cls: '' }}
          darkMode={darkMode}
          selectors={{ className: 'preview-block-portal' }}
          dragResizePortal={true}
          callgpt={null}
        >
          <ErrorBoundary>
            {/* CodeMirror and preview box */}
          </ErrorBoundary>
        </CodeHinter.Portal>
      </div>
    </div>
  );
};

export default MultiLineCodeEditor;


// frontend/src/_hooks/use-portal.jsx
import React from 'react';
import { Portal } from '@/_components/Portal';

const usePortal = ({ children, title = 'Editor', ...restProps }) => {
  const {
    isOpen,
    callback,
    componentName,
    key = '',
    customComponent = () => null,
    forceUpdate,
    optionalProps = {},
    selectors = {},
    dragResizePortal = false,
    callgpt,
    isCopilotEnabled = false,
  } = restProps;

  React.useEffect(() => {
    if (isOpen) forceUpdate();
  }, [componentName, isOpen, forceUpdate]);

  const styleProps = optionalProps.styles;

  return (
    <React.Fragment>
      {isOpen && (
        <Portal
          className={`modal-portal-wrapper ${localStorage.getItem('darkMode') === 'true' && 'dark-theme'} ${dragResizePortal && 'resize-modal-portal'
            }`}
          isOpen={isOpen}
          trigger={callback}
          componentName={componentName}
          title={title}
          dragResizePortal={dragResizePortal}
          callgpt={callgpt}
          isCopilotEnabled={isCopilotEnabled}
        >
          <div
            className={`editor-container ${optionalProps.cls ?? ''}`}
            key={key}
            data-cy={`codehinter-popup-input-field`}
          >
            {React.cloneElement(children, { ...styleProps })}
          </div>
          {customComponent()}
        </Portal>
      )}
      {children}
    </React.Fragment>
  );
};

export default usePortal;
