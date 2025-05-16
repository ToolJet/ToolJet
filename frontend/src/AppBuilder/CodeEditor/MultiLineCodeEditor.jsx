/* eslint-disable import/no-unresolved */
import React, { useContext, useEffect, useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
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
  } = props;
  const replaceIdsWithName = useStore((state) => state.replaceIdsWithName, shallow);
  const getSuggestions = useStore((state) => state.getSuggestions, shallow);

  const context = useContext(CodeHinterContext);

  const { suggestionList } = createReferencesLookup(context, true);

  const currentValueRef = useRef(initialValue);

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

    let JSLangHints = [];
    if (lang === 'javascript') {
      JSLangHints = Object.keys(hints['jsHints'])
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

    const appHints = hints['appHints'];

    let autoSuggestionList = appHints.filter((suggestion) => {
      return suggestion.hint.includes(nearestSubstring);
    });

    const suggestions = generateHints(
      [...JSLangHints, ...autoSuggestionList, ...suggestionList],
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
    };
  }

  const customKeyMaps = [...defaultKeymap, ...completionKeymap];
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
  ]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const overRideFunction = React.useCallback((context) => autoCompleteExtensionConfig(context), [suggestionList]);
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

  return (
    <div className="code-hinter-wrapper position-relative" style={{ width: '100%' }}>
      <div className={`${className} ${darkMode && 'cm-codehinter-dark-themed'}`}>
        <CodeHinter.PopupIcon
          callback={handleTogglePopupExapand}
          icon="portal-open"
          tip="Pop out code editor into a new window"
          isMultiEditor={true}
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
                value={initialValueWithReplacedIds}
                placeholder={placeholder}
                height={'100%'}
                minHeight={heightInPx}
                maxHeight={heightInPx}
                width="100%"
                theme={theme}
                extensions={[
                  langExtention,
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
                className={`codehinter-multi-line-input`}
                indentWithTab={false}
                readOnly={readOnly}
                editable={editable} //for transformations in query manager
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
