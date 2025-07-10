/* eslint-disable import/no-unresolved */
import React, { useContext, useEffect, useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { completionKeymap, acceptCompletion, autocompletion, completionStatus } from '@codemirror/autocomplete';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import _ from 'lodash';
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
import { syntaxTree } from '@codemirror/language';
import { search, searchKeymap, searchPanelOpen } from '@codemirror/search';
import { handleSearchPanel } from './SearchBox';
import { useQueryPanelKeyHooks } from './useQueryPanelKeyHooks';
import { isInsideParent } from './utils';
import { CodeHinterBtns } from './CodehinterOverlayTriggers';

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
    delayOnChange = true, // Added this prop to immediately update the onBlurUpdate callback
    readOnly = false,
    editable = true,
    renderCopilot,
    setCodeEditorView,
  } = props;
  const editorRef = useRef(null);

  const replaceIdsWithName = useStore((state) => state.replaceIdsWithName, shallow);
  const wrapperRef = useRef(null);
  const getSuggestions = useStore((state) => state.getSuggestions, shallow);
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

  const handleChange = (val) => (currentValueRef.current = val);

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

  const setupConfig = {
    lineNumbers: lineNumbers ?? true,
    syntaxHighlighting: true,
    bracketMatching: true,
    foldGutter: true,
    highlightActiveLine: false,
    autocompletion: hideSuggestion ?? true,
    highlightActiveLineGutter: false,
    defaultKeymap: false,
    completionKeymap: true,
    searchKeymap: false,
  };

  function autoCompleteExtensionConfig(context) {
    const currentCursor = context.pos;

    const currentString = context.state.doc.text;

    const inputStr = currentString.join(' ');
    const currentCurosorPos = currentCursor;
    const nearestSubstring = removeNestedDoubleCurlyBraces(findNearestSubstring(inputStr, currentCurosorPos));

    const hints = getSuggestions();

    const serverHints = getServerSideGlobalResolveSuggestions(isInsideQueryManager);

    const allHints = {
      ...hints,
      appHints: [...hints.appHints, ...serverHints],
    };

    let JSLangHints = [];
    if (lang === 'javascript') {
      JSLangHints = Object.keys(allHints['jsHints'])
        .map((key) => {
          return hints['jsHints'][key]['methods'].map((hint) => ({
            hint: hint,
            type: 'js_method',
          }));
        })
        .flat();

      JSLangHints = JSLangHints.filter((cm) => {
        let lastWordAfterDot = nearestSubstring.split('.');

        lastWordAfterDot = lastWordAfterDot[lastWordAfterDot.length - 1];

        if (cm.hint.includes(lastWordAfterDot)) return true;
      });
    }

    const appHints = allHints['appHints'];

    let autoSuggestionList = appHints.filter((suggestion) => {
      return suggestion.hint.includes(nearestSubstring);
    });

    const localVariables = new Set();

    // Traverse the syntax tree to extract variable declarations
    syntaxTree(context.state).iterate({
      enter: (node) => {
        // JavaScript: Detect variable declarations (var, let, const)
        if (node.name === 'VariableDefinition') {
          const varName = context.state.sliceDoc(node.from, node.to);
          if (varName && varName.startsWith(nearestSubstring)) localVariables.add(varName);
        }
      },
    });

    // Convert Set to an array of completion suggestions
    const localVariableSuggestions = [...localVariables].map((varName) => ({
      hint: varName,
      type: 'variable',
    }));

    const suggestionList = paramList.filter((paramSuggestion) => paramSuggestion.hint.includes(nearestSubstring));

    const suggestions = generateHints(
      [...localVariableSuggestions, ...JSLangHints, ...autoSuggestionList, ...suggestionList],
      null,
      nearestSubstring
    ).map((hint) => {
      if (hint.label.startsWith('client') || hint.label.startsWith('server')) return;

      delete hint['apply'];

      hint.apply = (view, completion, from, to) => {
        /**
         * This function applies an auto-completion logic to a text editing view based on user interaction.
         * It uses a pre-defined completion object and modifies the document's content accordingly.
         *
         * Parameters:
         * - view: The editor view where the changes will be applied.
         * - completion: An object containing details about the completion to be applied. Includes properties like 'label' (the text to insert) and 'type' (e.g., 'js_methods').
         * - from: The initial position (index) in the document where the completion starts.
         * - to: The position (index) in the document where the completion ends.
         *
         * Logic:
         * - The function calculates the start index for the change by subtracting the length of the word to be replaced (finalQuery) from the 'from' index.
         * - It configures the completion details such as where to insert the text and the exact text to insert.
         * - If the completion type is 'js_methods', it adjusts the insertion point to the 'to' index and sets the cursor position after the inserted text.
         * - Finally, it dispatches these configurations to the editor view to apply the changes.
         *
         * The dispatch configuration (dispacthConfig) includes changes and, optionally, the cursor selection position if the type is 'js_methods'.
         */

        const wordToReplace = nearestSubstring;
        const fromIndex = from - wordToReplace.length;

        const pickedCompletionConfig = {
          from: fromIndex === 1 ? 0 : fromIndex,
          to: to,
          insert: completion.label,
        };

        const dispacthConfig = {
          changes: pickedCompletionConfig,
        };

        if (completion.type === 'js_methods') {
          pickedCompletionConfig.from = to;

          dispacthConfig.selection = {
            anchor: pickedCompletionConfig.to + completion.label.length - 1,
          };
        }

        view.dispatch(dispacthConfig);
      };
      return hint;
    });

    return {
      from: context.pos,
      options: [...suggestions],
      filter: false,
    };
  }

  const customKeyMaps = [
    ...defaultKeymap.filter((keyBinding) => keyBinding.key !== 'Mod-Enter'), // Remove default keybinding for Mod-Enter
    ...completionKeymap,
    ...searchKeymap,
  ];

  const customTabKeymap = keymap.of([
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
  ]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const overRideFunction = React.useCallback((context) => autoCompleteExtensionConfig(context), [paramList]);
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

  const onAiSuggestionAccept = (newValue) => {
    currentValueRef.current = newValue;
    onChange(newValue);
  };

  return (
    <div
      className={`code-hinter-wrapper position-relative ${isInsideQueryPane ? 'code-editor-query-panel' : ''}`}
      style={{ width: '100%' }}
      ref={wrapperRef}
    >
      <div className={`${className} ${darkMode && 'cm-codehinter-dark-themed'}`}>
        <CodeHinterBtns
          view={editorView}
          isPanelOpen={isSearchPanelOpen}
          renderCopilot={() =>
            renderCopilot?.({
              darkMode,
              language: lang,
              editorRef,
              onAiSuggestionAccept,
            })
          }
        />

        <CodeHinter.PopupIcon
          callback={handleTogglePopupExapand}
          icon="portal-open"
          tip="Pop out code editor into a new window"
          isMultiEditor={true}
          isQueryManager={isInsideQueryPane}
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
        >
          <ErrorBoundary>
            <div className="codehinter-container w-100 " data-cy={`${cyLabel}-input-field`} style={{ height: '100%' }}>
              <CodeMirror
                ref={editorRef}
                value={initialValueWithReplacedIds}
                placeholder={placeholder}
                height={'100%'}
                minHeight={heightInPx}
                {...(isInsideQueryPane ? { maxHeight: '100%' } : {})}
                width="100%"
                theme={theme}
                extensions={[
                  langExtention,
                  search({
                    createPanel: handleSearchPanel,
                  }),
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
                  }),
                  customTabKeymap,
                  keymap.of([...customKeyMaps]),
                ]}
                onChange={handleChange}
                onBlur={handleOnBlur}
                basicSetup={setupConfig}
                style={{
                  overflowY: 'auto',
                }}
                className={`codehinter-multi-line-input ${isInsideQueryPane ? 'code-editor-query-panel' : ''}`}
                indentWithTab={false}
                readOnly={readOnly}
                editable={editable} //for transformations in query manager
                onCreateEditor={(view) => {
                  setEditorView(view);
                  if (setCodeEditorView) {
                    setCodeEditorView(view);
                  }
                }}
                onUpdate={(view) => {
                  setIsSearchPanelOpen(searchPanelOpen(view.state));
                  updateCurrentLineObserver(view);
                }}
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
