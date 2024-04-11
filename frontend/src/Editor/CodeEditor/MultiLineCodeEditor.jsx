/* eslint-disable import/no-unresolved */
import React, { useContext, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { defaultKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { completionKeymap } from '@codemirror/autocomplete';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { generateHints } from './autocompleteExtensionConfig';
import ErrorBoundary from '../ErrorBoundary';
import CodeHinter from './CodeHinter';
import { CodeHinterContext } from '../CodeBuilder/CodeHinterContext';
import { createReferencesLookup } from '@/_stores/utils';
import { PreviewBox } from './PreviewBox';
import { resolveCode } from './utils';

const langSupport = Object.freeze({
  javascript: javascript(),
  python: python(),
  sql: sql(),
  jsx: javascript({ jsx: true }),
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
    cyLabel,
    lineNumbers,
    placeholder,
    hideSuggestion,
    suggestions: hints,
    portalProps,
    showPreview,
  } = props;

  const [currentValue, setCurrentValue] = React.useState(() => initialValue);
  // const [resolvedValue, setResolvedValue] = React.useState(() => initialValue);

  // useEffect(() => {
  //   if (showPreview == true) {
  //     // resolveCode(currentValue);
  //     console.log('test---', resolveCode(currentValue));

  //     // setResolvedValue();
  //   }
  // }, [JSON.stringify(currentValue)]);

  const context = useContext(CodeHinterContext);

  const { suggestionList } = createReferencesLookup(context, true);

  const diffOfCurrentValue = React.useRef(null);

  const handleChange = React.useCallback((val) => {
    setCurrentValue(val);

    const diff = val.length - currentValue.length;

    if (diff > 0) {
      diffOfCurrentValue.current = val.slice(-diff);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOnBlur = React.useCallback(() => {
    onChange(currentValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  useEffect(() => {
    setCurrentValue(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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
    const lasttWord = context.state.doc.text
      .map((element) => element.trim())
      .join(' ')
      .split(' ')
      .filter((element) => {
        if (element === '' || element === ' ') {
          return false;
        }
        return true;
      });

    const currentWord = lasttWord[lasttWord.length - 1];

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
        let lastWordAfterDot = currentWord.split('.');

        lastWordAfterDot = lastWordAfterDot[lastWordAfterDot.length - 1];

        if (cm.hint.includes(lastWordAfterDot)) return true;
      });
    }

    const appHints = hints['appHints'];

    let autoSuggestionList = appHints.filter((suggestion) => {
      if (currentWord.length === 0) return true;

      return suggestion.hint.includes(currentWord);
    });

    const suggestions = generateHints([...JSLangHints, ...autoSuggestionList, ...suggestionList]).map((hint) => {
      delete hint['apply'];

      hint.apply = (view, completion, from, to) => {
        const doc = view.state.doc;

        const start = doc.lineAt(from).text.slice(0, from - 1);

        const word = start.split(' ').pop();

        const index = start.lastIndexOf(word);

        const changesStartIndexFromDocLine = doc.lineAt(from).from;

        const changeIndex = changesStartIndexFromDocLine > 0 ? changesStartIndexFromDocLine + index : index;

        const pickedCompletionConfig = {
          from: changeIndex,
          to: to,
          insert: completion.label,
        };

        if (completion.type === 'js_methods') {
          pickedCompletionConfig.from = to;
        }

        view.dispatch({
          changes: pickedCompletionConfig,
        });
      };
      return hint;
    });

    return {
      from: context.pos,
      options: [...suggestions],
    };
  }

  const customKeyMaps = [...defaultKeymap, ...completionKeymap];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const overRideFunction = React.useCallback((context) => autoCompleteExtensionConfig(context), [hints]);
  const { handleTogglePopupExapand, isOpen, setIsOpen, forceUpdate } = portalProps;

  return (
    <div className="code-hinter-wrapper position-relative" style={{ width: '100%' }}>
      <div className={`${className} ${darkMode && 'cm-codehinter-dark-themed'}`} cyLabel={cyLabel}>
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
            <div className="codehinter-container w-100 ">
              <CodeMirror
                value={currentValue}
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
                  keymap.of([...customKeyMaps]),
                ]}
                onChange={handleChange}
                onBlur={handleOnBlur}
                basicSetup={setupConfig}
                style={{
                  overflowY: 'auto',
                }}
                className={`codehinter-multi-line-input`}
                indentWithTab={true}
              />
            </div>
            {showPreview && (
              <div className="multiline-previewbox-wrapper">
                <PreviewBox
                  currentValue={currentValue}
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
