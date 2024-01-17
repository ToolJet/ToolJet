/* eslint-disable import/no-unresolved */
import React, { useEffect } from 'react';
import { PreviewBox } from './PreviewBox';
import { ToolTip } from '@/Editor/Inspector/Elements/Components/ToolTip';
import { useTranslation } from 'react-i18next';
import { camelCase } from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion } from '@codemirror/autocomplete';
import FxButton from '../CodeBuilder/Elements/FxButton';
import cx from 'classnames';
import { DynamicFxTypeRenderer } from './DynamicFxTypeRenderer';
import { paramValidation } from './utils';

const SingleLineCodeEditor = ({ suggestions, componentName, fieldMeta, ...restProps }) => {
  const { initialValue, onChange } = restProps;
  const { validation } = fieldMeta;

  const [isFocused, setIsFocused] = React.useState(false);
  const [currentValue, setCurrentValue] = React.useState(() => initialValue);

  return (
    <div className=" code-editor-basic-wrapper d-flex">
      <div className="codehinter-container w-100 ">
        <SingleLineCodeEditor.Editor
          currentValue={currentValue}
          setCurrentValue={setCurrentValue}
          hints={suggestions}
          setFocus={setIsFocused}
          validationType={validation?.schema?.type}
          onBlurUpdate={onChange}
        />

        <PreviewBox
          currentValue={currentValue}
          isFocused={isFocused}
          componentName={componentName}
          expectedType={validation?.schema?.type}
        />
      </div>
    </div>
  );
};

const EditorInput = ({ currentValue, setCurrentValue, hints, setFocus, validationType, onBlurUpdate }) => {
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

  const handleOnChange = React.useCallback((val) => {
    setCurrentValue(val);
  }, []);

  const handleOnBlur = React.useCallback(() => {
    setFocus(false);
    const shouldUpdate = paramValidation(currentValue, validationType);

    if (shouldUpdate) {
      onBlurUpdate(currentValue);
    }
  }, []);

  return (
    <CodeMirror
      value={currentValue}
      height="32px"
      extensions={[javascript({ jsx: false }), myComplete]}
      onChange={handleOnChange}
      basicSetup={{
        lineNumbers: false,
        syntaxHighlighting: true,
        bracketMatching: true,
        foldGutter: false,
        highlightActiveLine: false,
        autocompletion: true,
      }}
      onFocus={() => setFocus(true)}
      onBlur={handleOnBlur}
      style={{
        borderRadius: '4px',
        border: '1px solid #d9d9d9',
      }}
    />
  );
};

const DynamicEditorBridge = (props) => {
  const {
    initialValue,
    resolvedValue,
    fxActive,
    paramType,
    paramLabel,
    paramName,
    fieldMeta,
    darkMode,
    options,
    className,
    onFxPress,
    cyLabel = '',
    verticalLine = false,
    onChange,
  } = props;
  const [forceCodeBox, setForceCodeBox] = React.useState(fxActive);
  const codeShow = paramType === 'code' || forceCodeBox;

  const HIDDEN_CODE_HINTER_LABELS = ['Table data', 'Column data'];

  const { t } = useTranslation();

  return (
    <div className={cx({ 'codeShow-active': codeShow })}>
      <div className={cx('d-flex align-items-center justify-content-between')}>
        {paramLabel === 'Type' && <div className="field-type-vertical-line"></div>}
        {paramLabel && !HIDDEN_CODE_HINTER_LABELS.includes(paramLabel) && (
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
        <div className={`${(paramType ?? 'code') === 'code' ? 'd-none' : ''} `}>
          <div
            style={{ width: paramType, marginBottom: codeShow ? '0.5rem' : '0px' }}
            className="d-flex align-items-center"
          >
            <div className="col-auto pt-0 fx-common">
              {paramLabel !== 'Type' && (
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
              )}
            </div>
            {!codeShow && (
              <DynamicFxTypeRenderer
                value={resolvedValue}
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
              />
            )}
          </div>
        </div>
      </div>
      {codeShow && (
        <div className={`row custom-row`} style={{ display: codeShow ? 'flex' : 'none' }}>
          <div className={`col code-hinter-col`}>
            <div className="d-flex">
              <div className={`${verticalLine && 'code-hinter-vertical-line'}`}></div>
              <div className="code-hinter-wrapper position-relative" style={{ width: '100%' }}>
                <SingleLineCodeEditor initialValue {...props} />
              </div>
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
