/* eslint-disable import/no-unresolved */
import React, { useContext, useEffect, useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { keymap, tooltips, EditorView } from '@codemirror/view';
import { completionKeymap, acceptCompletion, autocompletion, completionStatus } from '@codemirror/autocomplete';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import _ from 'lodash';
import cx from 'classnames';
import { sass, sassCompletionSource } from '@codemirror/lang-sass';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { getSuggestionsForMultiLine } from './autocompleteExtensionConfig';
import ErrorBoundary from '@/_ui/ErrorBoundary';
import CodeHinter from './CodeHinter';
import { CodeHinterContext } from '../CodeBuilder/CodeHinterContext';
import { createReferencesLookup } from '@/_stores/utils';
import { PreviewBox } from './PreviewBox';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { search, searchKeymap, searchPanelOpen } from '@codemirror/search';
import { handleSearchPanel } from './SearchBox';
import { useQueryPanelKeyHooks } from './useQueryPanelKeyHooks';
import { isInsideParent } from './utils';
import { CodeHinterBtns } from './CodehinterOverlayTriggers';
import useWorkflowStore from '@/_stores/workflowStore';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { TableColumnContext } from '@/AppBuilder/RightSideBar/Inspector/Components/Table/ColumnManager/TableColumnContext';
import { useStableCallback } from '@/AppBuilder/_hooks/useStableCallback';

const langSupport = Object.freeze({
  javascript: javascript(),
  python: python(),
  sql: sql(),
  jsx: javascript({ jsx: true }),
  css: sass(),
});

const lineWrappingExtension = EditorView.lineWrapping;

// Hoisted to module scope so their identity never changes: anything fed into the
// CodeMirror `extensions` prop must stay referentially stable, otherwise
// react-codemirror dispatches a reconfigure on every render, which permanently
// grows style-mod's shared stylesheet and degrades the whole session.
const staticCustomKeyMaps = [
  ...defaultKeymap.filter((keyBinding) => keyBinding.key !== 'Mod-Enter'), // Remove default keybinding for Mod-Enter
  ...completionKeymap,
  ...searchKeymap,
];
const searchExtension = search({
  createPanel: handleSearchPanel,
});
const tooltipExtension = tooltips({
  parent: document.body,
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
    delayOnChange = true, // Added this prop to immediately update the onBlurUpdate callback
    readOnly = false,
    editable = true,
    renderCopilot,
    setCodeEditorView,
    onInputChange, // Added this prop to immediately handle value changes
    foldGutter = true, // controls the left gray bar
    componentId,
  } = props;
  const { moduleId: contextModuleId } = useModuleContext();
  const moduleId = props.moduleId || contextModuleId || 'canvas';
  const editorRef = useRef(null);

  const replaceIdsWithName = useStore((state) => state.replaceIdsWithName, shallow);
  const wrapperRef = useRef(null);
  const getSuggestions = useStore((state) => state.getSuggestions, shallow);
  // Context-aware hints for components inside ListView/Kanban and table columns
  const getContextHints = useStore((state) => state.getContextHints, shallow);
  const getTableColumnContextHints = useStore((state) => state.getTableColumnContextHints, shallow);
  const tableColumnComponentId = useContext(TableColumnContext)?.tableId; // Set at ColumnPopover level
  const getServerSideGlobalResolveSuggestions = useStore(
    (state) => state.getServerSideGlobalResolveSuggestions,
    shallow
  );

  const isInsideQueryPane = !!document.querySelector('.code-hinter-wrapper')?.closest('.query-details');
  const isInsideQueryManager = useMemo(
    () => isInsideParent(wrapperRef?.current, 'query-manager'),
    [wrapperRef.current]
  );

  const context = useContext(CodeHinterContext);

  const { workflowSuggestions } = useWorkflowStore((state) => ({ workflowSuggestions: state.suggestions }), shallow);

  const { suggestionList: paramList } = createReferencesLookup(context, true);

  const currentValueRef = useRef(initialValue);

  const [editorView, setEditorView] = React.useState(null);

  const [isSearchPanelOpen, setIsSearchPanelOpen] = React.useState(false);
  const { queryPanelKeybindings } = useQueryPanelKeyHooks(onChange, currentValueRef, 'multiline');

  // Add state for tracking autocomplete visibility
  const [showSuggestions, setShowSuggestions] = React.useState(true);
  const currentLineObserverRef = useRef(null);
  const isObserverTriggeredRef = useRef(false);

  // Intersection observer to detect when current line goes out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 1) {
          setShowSuggestions(false);
          isObserverTriggeredRef.current = true;
          // Close autocomplete dropdown by dispatching a selection change
          if (editorView) {
            editorView.dispatch({
              selection: editorView.state.selection,
            });
          }
        } else {
          setShowSuggestions(true);
          isObserverTriggeredRef.current = false;
        }
      },
      { root: null, threshold: [1] }
    );

    currentLineObserverRef.current = observer;

    return () => {
      if (currentLineObserverRef.current) {
        currentLineObserverRef.current.disconnect();
      }
    };
  }, [editorView]);

  const handleChange = useStableCallback((val) => {
    currentValueRef.current = val;
    onInputChange && onInputChange(val);
  });

  const handleOnBlur = () => {
    if (!delayOnChange) return onChange(currentValueRef.current);
    setTimeout(() => {
      onChange(currentValueRef.current);
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  };

  const heightInPx = typeof height === 'string' && height?.includes('px') ? height : `${height}px`;

  const theme = darkMode ? okaidia : githubLight;
  const langExtention = langSupport[lang] ?? null;

  const setupConfig = useMemo(
    () => ({
      lineNumbers: lineNumbers ?? true,
      syntaxHighlighting: true,
      bracketMatching: true,
      foldGutter: foldGutter,
      highlightActiveLine: false,
      autocompletion: hideSuggestion ?? true,
      highlightActiveLineGutter: false,
      defaultKeymap: false,
      completionKeymap: true,
      searchKeymap: false,
    }),
    [lineNumbers, foldGutter, hideSuggestion]
  );

  function autoCompleteExtensionConfig(context) {
    const hasWorkflowSuggestions =
      workflowSuggestions?.appHints?.length > 0 || workflowSuggestions?.jsHints?.length > 0;
    const hints = hasWorkflowSuggestions ? workflowSuggestions : getSuggestions();
    const serverHints = getServerSideGlobalResolveSuggestions(isInsideQueryManager);

    // Prepend context-aware hints (listItem, cardData, rowData, siblings) before app hints
    const contextHints = componentId ? getContextHints(componentId, moduleId) : [];
    const tableContextHints = tableColumnComponentId
      ? getTableColumnContextHints(tableColumnComponentId, moduleId)
      : [];
    const allHints = {
      ...hints,
      appHints: [...tableContextHints, ...contextHints, ...hints.appHints, ...serverHints],
    };

    return getSuggestionsForMultiLine(context, allHints, hints, lang, paramList);
  }

  const customTabKeymap = useMemo(
    () =>
      keymap.of([
        {
          key: 'Tab',
          run: (view) => {
            if (completionStatus(view.state)) {
              return acceptCompletion(view);
            }

            const { state } = view;
            const { selection } = state;
            const { anchor } = selection.main;
            const tabSize = 2;

            view.dispatch({
              changes: { from: anchor, insert: ' '.repeat(tabSize) },
              selection: { anchor: anchor + tabSize },
            });
            return true;
          },
        },
        ...queryPanelKeybindings,
      ]),
    [queryPanelKeybindings]
  );

  // Stable identity, fresh values: the override function handed to CodeMirror never
  // changes, but it always delegates to the latest closure (with current hints,
  // suggestions and paramList). A changing identity here would invalidate the
  // extensions and force a full editor reconfigure on every render.
  const overRideFunction = useStableCallback(autoCompleteExtensionConfig);

  const editorExtensions = useMemo(
    () => [
      langExtention,
      lineWrappingExtension,
      searchExtension,
      tooltipExtension,
      javascriptLanguage.data.of({
        autocomplete: overRideFunction,
      }),
      python().language.data.of({
        autocomplete: overRideFunction,
      }),
      sql().language.data.of({
        autocomplete: overRideFunction,
      }),
      sass().language.data.of({
        autocomplete: sassCompletionSource,
      }),
      autocompletion({
        override: [overRideFunction],
        activateOnTyping: true,
        compareCompletions: (a, b) => {
          return a.section.rank - b.section.rank && a.label.localeCompare(b.label);
        },
      }),
      customTabKeymap,
      keymap.of([...staticCustomKeyMaps]),
    ],
    [langExtention, overRideFunction, customTabKeymap]
  );

  const { handleTogglePopupExapand, isOpen, setIsOpen, forceUpdate } = portalProps;
  let cyLabel = paramLabel ? paramLabel.toLowerCase().trim().replace(/\s+/g, '-') : props.cyLabel;

  const initialValueWithReplacedIds = useMemo(() => {
    if (
      typeof initialValue === 'string' &&
      (initialValue?.includes('components') || initialValue?.includes('queries'))
    ) {
      return replaceIdsWithName(initialValue);
    }
    return initialValue;
  }, [initialValue, replaceIdsWithName]);

  // @uiw/react-codemirror annotates external value-prop changes with ExternalChange
  // and skips calling onChange to avoid echoing. This means currentValueRef stays stale
  // when the value is set programmatically (e.g. AI-generated code). Sync it here so
  // that handleOnBlur propagates the correct value when the user clicks Run.
  useEffect(() => {
    currentValueRef.current = initialValueWithReplacedIds ?? '';
  }, [initialValueWithReplacedIds]);

  function updateCurrentLineObserver(editorView) {
    if (!editorView || !editorView?.view?.dom) return;
    const cursorPos = editorView.state.selection.main.head;
    const line = editorView.state.doc.lineAt(cursorPos);
    const lineNumber = line.number;
    const cmLines = editorView.view.dom.querySelectorAll('.cm-line');
    const currentLineDiv = cmLines[lineNumber - 1] || null;

    // Update intersection observer to watch the current line
    if (currentLineObserverRef.current && currentLineDiv && !isObserverTriggeredRef.current) {
      currentLineObserverRef.current.disconnect();
      currentLineObserverRef.current.observe(currentLineDiv);
    }
  }

  // `onUpdate` is part of react-codemirror's reconfigure-effect dependencies, so it
  // must keep a stable identity.
  const handleEditorUpdate = useStableCallback((view) => {
    setIsSearchPanelOpen(searchPanelOpen(view.state));
    updateCurrentLineObserver(view);
  });

  const onAiSuggestionAccept = (newValue) => {
    currentValueRef.current = newValue;
    onChange(newValue);
  };

  const copilotBtnSlot = renderCopilot?.({ darkMode, language: lang, editorRef, onAiSuggestionAccept });

  return (
    <div
      className={`code-hinter-wrapper position-relative ${isInsideQueryPane ? 'code-editor-query-panel' : ''}`}
      style={{ width: '100%' }}
      ref={wrapperRef}
    >
      <div className={`${className} ${darkMode && 'cm-codehinter-dark-themed'}`}>
        <CodeHinterBtns view={editorView} isPanelOpen={isSearchPanelOpen} copilotBtnSlot={copilotBtnSlot} />

        <CodeHinter.PopupIcon
          callback={handleTogglePopupExapand}
          icon="portal-open"
          tip="Pop out code editor into a new window"
          isMultiEditor={true}
          isQueryManager={isInsideQueryPane}
          position={{ height: height }}
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
          selectors={{ className: 'preview-block-portal' }}
          dragResizePortal={true}
          callgpt={null}
          onPortalDimensionsChange={portalProps?.onPortalDimensionsChange}
          canRefresh={portalProps?.canRefresh}
        >
          <ErrorBoundary>
            <div className="codehinter-container w-100 " data-cy={`${cyLabel}-input-field`} style={{ height: '100%' }}>
              <CodeMirror
                ref={editorRef}
                value={initialValueWithReplacedIds}
                placeholder={placeholder}
                height={heightInPx}
                minHeight={heightInPx}
                {...(isInsideQueryPane ? { maxHeight: '100%' } : {})}
                width="100%"
                theme={theme}
                extensions={editorExtensions}
                onChange={handleChange}
                onBlur={handleOnBlur}
                basicSetup={setupConfig}
                style={{
                  overflowY: 'auto',
                }}
                className={cx('codehinter-multi-line-input', {
                  'code-editor-query-panel': isInsideQueryPane,
                  'has-overlay-controls': !isSearchPanelOpen || Boolean(copilotBtnSlot),
                })}
                indentWithTab={false}
                readOnly={readOnly}
                editable={editable} //for transformations in query manager
                onCreateEditor={(view) => {
                  setEditorView(view);
                  if (setCodeEditorView) {
                    setCodeEditorView(view);
                  }
                }}
                onUpdate={handleEditorUpdate}
              />
            </div>
            {showPreview && (
              <div className="multiline-previewbox-wrapper">
                <PreviewBox
                  currentValue={currentValueRef.current}
                  validationSchema={null}
                  setErrorStateActive={() => null}
                  componentId={null}
                  setErrorMessage={() => null}
                />
              </div>
            )}
          </ErrorBoundary>
        </CodeHinter.Portal>
      </div>
    </div>
  );
};

export default MultiLineCodeEditor;
