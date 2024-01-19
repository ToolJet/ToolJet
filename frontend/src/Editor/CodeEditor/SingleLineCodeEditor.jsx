/* eslint-disable import/no-unresolved */
import React from 'react';
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
import { paramValidation, resolveReferences } from './utils';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { getAutocompletion } from './autocompleteExtensionConfig';
import ErrorBoundary from '../ErrorBoundary';

const SingleLineCodeEditor = ({ type, suggestions, componentName, fieldMeta = {}, ...restProps }) => {
  const { initialValue, onChange, enablePreview = true } = restProps;
  const { validation = {} } = fieldMeta;

  const [isFocused, setIsFocused] = React.useState(false);
  const [currentValue, setCurrentValue] = React.useState(() => initialValue);
  const [errorStateActive, setErrorStateActive] = React.useState(false);

  return (
    <div className=" code-editor-basic-wrapper d-flex">
      <div className="codehinter-container w-100 ">
        <SingleLineCodeEditor.Editor
          type={type}
          currentValue={currentValue}
          setCurrentValue={setCurrentValue}
          hints={suggestions}
          setFocus={setIsFocused}
          validationType={validation?.schema?.type}
          onBlurUpdate={onChange}
          error={errorStateActive}
          cyLabel={restProps.cyLabel}
        />

        {enablePreview && (
          <PreviewBox
            currentValue={currentValue}
            isFocused={isFocused}
            componentName={componentName}
            expectedType={validation?.schema?.type}
            setErrorStateActive={setErrorStateActive}
          />
        )}
      </div>
    </div>
  );
};

const EditorInput = ({
  type,
  currentValue,
  setCurrentValue,
  hints,
  setFocus,
  validationType,
  onBlurUpdate,
  placeholder = '',
  error,
  cyLabel,
}) => {
  function autoCompleteExtensionConfig(context) {
    let before = context.matchBefore(/\w+/);

    if (!context.explicit && !before) {
      return null;
    }

    let completions = getAutocompletion(context.state.doc.toString(), validationType, hints);

    return {
      from: context.pos,
      options: [...completions],
      validFor: /^\{\{.*\}\}$/,
    };
  }

  const autoCompleteConfig = autocompletion({
    override: [autoCompleteExtensionConfig],
    compareCompletions: (a, b) => {
      return a.label < b.label ? -1 : 1;
    },
    aboveCursor: false,
    defaultKeymap: true,
  });

  const handleOnChange = React.useCallback((val) => {
    setCurrentValue(val);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOnBlur = React.useCallback(() => {
    setFocus(false);

    const [value] = resolveReferences(currentValue);

    const shouldUpdate = validationType ? paramValidation(validationType, value) : true;

    if (!error && shouldUpdate) {
      onBlurUpdate(currentValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, error]);

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const theme = darkMode ? okaidia : githubLight;

  return (
    <div className={` ${darkMode && 'cm-codehinter-dark-themed'}`} cyLabel={cyLabel}>
      <ErrorBoundary>
        <CodeMirror
          value={currentValue}
          placeholder={placeholder}
          height={type === 'basic' ? '30px' : 'fit-content'}
          maxHeight="320px"
          width="100%"
          extensions={[javascript({ jsx: false }), autoCompleteConfig]}
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
          className={`codehinter-input ${error && 'border-danger'}`}
          theme={theme}
        />
      </ErrorBoundary>
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
  const [value, error] = type === 'fxEditor' ? resolveReferences(initialValue) : [];

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
