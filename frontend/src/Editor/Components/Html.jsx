import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import Spinner from '@/_ui/Spinner';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';

export const Html = function ({
  height,
  properties,
  styles,
  darkMode,
  dataCy,
  setExposedVariable,
  setExposedVariables,
}) {
  const { rawHtml: stringifyHTML, loadingState, disabledState, visibility } = properties || {};
  const baseStyle = {
    backgroundColor: darkMode ? '#47505D' : '#ffffff',
    color: darkMode ? 'white' : 'black',
  };
  const { boxShadow } = styles || {};

  const isInitialRender = useRef(true);

  const [rawHtml, setRawHtml] = useState('');
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isVisible: visibility,
    isLoading: loadingState,
    isDisabled: disabledState,
    rawHTML: stringifyHTML || '',
  });

  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    setRawHtml(stringifyHTML || '');
  }, [stringifyHTML]);

  useEffect(() => {
    DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      // set all elements owning target to target=_blank
      if ('target' in node) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener');
      }
    });
  }, []);

  useBatchedUpdateEffectArray([
    {
      dep: visibility,
      sideEffect: () => {
        setExposedVariable('isVisible', visibility);
        updateExposedVariablesState('isVisible', visibility);
      },
    },
    {
      dep: loadingState,
      sideEffect: () => {
        setExposedVariable('isLoading', loadingState);
        updateExposedVariablesState('isLoading', loadingState);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        setExposedVariable('isDisabled', disabledState);
        updateExposedVariablesState('isDisabled', disabledState);
      },
    },
    {
      dep: stringifyHTML || '',
      sideEffect: () => {
        const rawHtmlValue = stringifyHTML || '';
        setRawHtml(rawHtmlValue);
        setExposedVariable('rawHTML', rawHtmlValue);
        updateExposedVariablesState('rawHTML', rawHtmlValue);
      },
    },
  ]);

  useEffect(() => {
    const exposedVariables = {
      rawHTML: stringifyHTML || '',
      setRawHTML: async function (value) {
        const rawHtmlValue = value || '';
        setRawHtml(rawHtmlValue);
        setExposedVariable('rawHTML', rawHtmlValue);
        updateExposedVariablesState('rawHTML', rawHtmlValue);
      },
      setVisibility: async function (value) {
        setExposedVariable('isVisible', !!value);
        updateExposedVariablesState('isVisible', !!value);
      },
      setLoading: async function (value) {
        setExposedVariable('isLoading', !!value);
        updateExposedVariablesState('isLoading', !!value);
      },
      setDisable: async function (value) {
        setExposedVariable('isDisabled', !!value);
        updateExposedVariablesState('isDisabled', !!value);
      },
      isVisible: visibility,
      isLoading: loadingState,
      isDisabled: disabledState,
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`jet-container ${exposedVariablesTemporaryState.isLoading && 'jet-container-loading'}`}
      data-disabled={exposedVariablesTemporaryState.isDisabled}
      style={{
        background: exposedVariablesTemporaryState.isLoading && 'var(--cc-surface1-surface)',
        display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
        border: exposedVariablesTemporaryState.isLoading && '1px solid var(--cc-default-border)',
        borderRadius: exposedVariablesTemporaryState.isLoading && '6px',
        width: '100%',
        height,
        overflowY: 'auto',
        boxShadow,
        position: 'relative',
        opacity: exposedVariablesTemporaryState.isDisabled ? 0.5 : 1,
        pointerEvents: exposedVariablesTemporaryState.isDisabled ? 'none' : 'auto',
      }}
      data-cy={dataCy}
      aria-busy={exposedVariablesTemporaryState.isLoading}
    >
      {exposedVariablesTemporaryState.isLoading ? (
        <Spinner />
      ) : (
        <div
          style={baseStyle}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml, { FORCE_BODY: true }) }}
        />
      )}
    </div>
  );
};
