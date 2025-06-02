/* eslint-disable import/no-unresolved */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { removeNestedDoubleCurlyBraces } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const SingleLineCodeEditor = ({ componentName, fieldMeta = {}, componentId, ...restProps }) => {
  const { initialValue, onChange, enablePreview = true, portalProps, renderPreview, cyLabel } = restProps;
  const { validation = {} } = fieldMeta;
  const [showPreview, setShowPreview] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [currentValue, setCurrentValue] = useState('');
  const [errorStateActive, setErrorStateActive] = useState(false);
  const [cursorInsidePreview, setCursorInsidePreview] = useState(false);
  const validationFn = restProps?.validationFn;
  const componentDefinition = useStore((state) => state.getComponentDefinition(componentId), shallow);
  const parentId = componentDefinition?.component?.parent;
  const customResolvables = useStore((state) => state.resolvedStore.modules.canvas?.customResolvables, shallow);
  const customVariables = customResolvables?.[parentId]?.[0] || {};

  const replaceIdsWithName = useStore((state) => state.replaceIdsWithName, shallow);
  let newInitialValue = initialValue;
  if (typeof initialValue === 'string' && (initialValue.includes('components') || initialValue.includes('queries'))) {
    newInitialValue = replaceIdsWithName(initialValue);
  }

  useEffect(() => {
    if (typeof newInitialValue !== 'string') return;
    const [valid, _error] =
      !isEmpty(validation) || validationFn
        ? resolveReferences(newInitialValue, validation, customVariables, validationFn)
        : [true, null];
    setErrorStateActive(!valid);
    setCurrentValue(newInitialValue);
  }, [componentName, newInitialValue, validationFn]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cursorInsidePreview || portalProps?.isOpen || event.target.closest('.cm-tooltip-autocomplete')) {
        return;
      }
      if (wrapperRef.current && isFocused && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [cursorInsidePreview, isFocused, portalProps?.isOpen]);

  const wrapperRef = useRef(null);
  const previewRef = useRef(null);
  const isWorkspaceVariable =
    typeof currentValue === 'string' && (currentValue.includes('%%client') || currentValue.includes('%%server'));

  const { handleTogglePopupExapand, isOpen, setIsOpen, forceUpdate } = portalProps;

  return (
    <div ref={wrapperRef} className="code-hinter-wrapper position-relative" style={{ width: '100%' }}>
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
        componentId={componentId}
        isWorkspaceVariable={isWorkspaceVariable}
        errorStateActive={errorStateActive}
        previewPlacement={restProps?.cyLabel === 'canvas-bg-colour' ? 'top' : 'left-start'}
        isPortalOpen={portalProps?.isOpen}
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
              cyLabel={cyLabel}
              portalProps={portalProps}
              componentName={componentName}
              setShowPreview={setShowPreview}
              showPreview={showPreview}
              {...restProps}
            />
          </div>
        </div>
      </PreviewBox.Container>
      <div className="d-flex justify-content-end w-100 position-absolute codehinter-popup-icon">
        <CodeHinter.PopupIcon
          callback={handleTogglePopupExapand}
          icon="portal-open"
          tip="Pop out code editor into a new window"
          position={wrapperRef.current?.getBoundingClientRect()}
          isQueryManager={false}
        />
      </div>
      <CodeHinter.Portal
        isOpen={isOpen}
        callback={setIsOpen}
        componentName={componentName}
        title={componentName || 'Editor'}
        key={componentName}
        customComponent={renderPreview}
        forceUpdate={forceUpdate}
        optionalProps={{ styles: { height: 300 }, cls: '' }}
        darkMode={localStorage.getItem('darkMode') === 'true'}
        selectors={{ className: 'preview-block-portal' }}
        dragResizePortal={true}
        callgpt={null}
      >
        <ErrorBoundary>
          <CodeMirror
            value={currentValue}
            extensions={[javascript({ jsx: restProps.lang === 'jsx' }), autocompletion({ override: [overRideFunction] }), keymap.of([...defaultKeymap, ...completionKeymap]), customTabKeymap]}
            onChange={(val) => { handleOnChange(val); restProps.onInputChange?.(val); }}
            basicSetup={{ lineNumbers: restProps.lang === 'jsx', syntaxHighlighting: true }}
            onMouseDown={() => setIsFocused(true)}
            onBlur={() => handleOnBlur()}
            className={cx('cm-codehinter', { 'cm-codehinter-dark-themed': darkMode })}
            theme={darkMode ? okaidia : githubLight}
            readOnly={restProps.disabled}
          />
        </ErrorBoundary>
      </CodeHinter.Portal>
    </div>
  );
};

const EditorInput = (props) => {
  // ... unchanged EditorInput code ...
};

SingleLineCodeEditor.Editor = EditorInput;
SingleLineCodeEditor.EditorBridge = DynamicEditorBridge;

export default SingleLineCodeEditor;
