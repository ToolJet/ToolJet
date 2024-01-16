/* eslint-disable import/no-unresolved */
import React from 'react';
import { PreviewBox } from './PreviewBox';
import { ToolTip } from '@/Editor/Inspector/Elements/Components/ToolTip';
import { useTranslation } from 'react-i18next';
import { camelCase } from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion } from '@codemirror/autocomplete';

const SingleLineCodeEditor = ({ paramLabel, suggestions, componentName, darkMode, fieldMeta }) => {
  const { t } = useTranslation();

  const { validation } = fieldMeta;

  const [isFocused, setIsFocused] = React.useState(false);
  const [currentValue, setCurrentValue] = React.useState('');

  return (
    <div className="code-editor-basic-wrapper">
      {paramLabel && (
        <div className={`field`} data-cy={`${'cyLabel'}-widget-parameter-label`}>
          <ToolTip
            label={t(`widget.commonProperties.${camelCase(paramLabel)}`, paramLabel)}
            meta={fieldMeta}
            labelClass={`tj-text-xsm color-slate12 mb-2 ${darkMode && 'color-whitish-darkmode'}`}
          />
        </div>
      )}
      <div className="d-flex">
        {/* <div className="field-type-vertical-line"></div> */}
        <div className="codehinter-container w-100 ">
          <SingleLineCodeEditor.Editor
            currentValue={currentValue}
            setValue={setCurrentValue}
            hints={suggestions}
            setFocus={setIsFocused}
            validationType={validation?.schema?.type}
          />

          <PreviewBox currentValue={currentValue} isFocused={isFocused} componentName={componentName} />
        </div>
      </div>
    </div>
  );
};

const EditorInput = ({ currentValue, setValue, hints, setFocus, validationType }) => {
  function orderSuggestions(suggestions, validationType) {
    const matchingSuggestions = suggestions.filter((s) => s.type === validationType);

    const otherSuggestions = suggestions.filter((s) => s.type !== validationType);

    return [...matchingSuggestions, ...otherSuggestions];
  }

  const getAutocompletion = (input, fieldType) => {
    if (!input.startsWith('{{') || !input.endsWith('}}')) return [];

    const actualInput = input.replace(/{{|}}/g, '');

    const JSLangHints = hints['jsHints'][fieldType]['methods'].map((hint) => ({
      hint: hint,
      type: 'js_method',
    }));

    const appHints = hints['appHints'].filter((cm) => {
      const { hint } = cm;

      if (hint.includes('actions')) {
        return false;
      }

      const lastChar = hint[cm.length - 1];
      if (lastChar === ')') {
        return false;
      }

      return true;
    });

    const finalHints = [...JSLangHints, ...appHints];

    let autoSuggestionList = finalHints.filter((suggestion) => {
      if (actualInput.length === 0) return true;

      return suggestion.hint.includes(actualInput);
    });

    const finalAutoSuggestions = [...JSLangHints, ...autoSuggestionList];

    const priorityOrder = actualInput.endsWith('.');

    const suggestions = finalAutoSuggestions.map(({ hint, type }) => {
      return {
        label: hint,
        type: type === 'js_method' ? 'js_methods' : type?.toLowerCase(),
        section:
          type === 'js_method'
            ? { name: 'JS methods', rank: priorityOrder ? 1 : 2 }
            : { name: 'suggestions', rank: !priorityOrder ? 1 : 2 },
        detail: type === 'js_method' ? 'method' : type?.toLowerCase() || '',
      };
    });

    return orderSuggestions(suggestions, fieldType).map((cm, index) => ({ ...cm, boost: 100 - index }));
  };

  function myCompletions(context) {
    let before = context.matchBefore(/\w+/);

    if (!context.explicit && !before) {
      return null;
    }

    let completions = getAutocompletion(context.state.doc.toString(), validationType);

    return {
      from: context.pos,
      options: [...completions],
      validFor: /^\{\{.*\}\}$/,
    };
  }

  const myComplete = autocompletion({
    override: [myCompletions],
    compareCompletions: (a, b) => {
      return a.label < b.label ? -1 : 1;
    },
    aboveCursor: false,
    defaultKeymap: true,
  });

  const onChange = React.useCallback((val) => {
    setValue(val);
  }, []);

  return (
    <CodeMirror
      value={currentValue}
      height="32px"
      extensions={[javascript({ jsx: false }), myComplete]}
      onChange={onChange}
      basicSetup={{
        lineNumbers: false,
        syntaxHighlighting: true,
        bracketMatching: true,
        foldGutter: false,
        highlightActiveLine: false,
        autocompletion: true,
      }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        borderRadius: '4px',
        border: '1px solid #d9d9d9',
      }}
    />
  );
};

SingleLineCodeEditor.Editor = EditorInput;

export default SingleLineCodeEditor;
