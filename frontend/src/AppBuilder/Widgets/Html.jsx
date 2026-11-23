import React, { useState, useEffect, useRef } from 'react';
import cx from 'classnames';
import Spinner from '@/_ui/Spinner';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { sanitizeAuthoredHtml } from '@/_helpers/sanitizeAuthoredHtml';
import './html.scss';

export const Html = function ({
  id,
  height,
  width,
  properties,
  styles,
  darkMode,
  dataCy,
  setExposedVariable,
  setExposedVariables,
  currentLayout,
  currentMode,
  subContainerIndex,
  componentType,
}) {
  const { rawHtml: stringifyHTML, loadingState, disabledState, visibility } = properties || {};
  const { boxShadow, backgroundColor } = styles || {};
  const baseStyle = {
    backgroundColor: backgroundColor ? backgroundColor : darkMode ? '#47505D' : '#ffffff',
    color: darkMode ? 'white' : 'black',
    width: '100%',
    // This element carries the background and is a flex item of a scrolling, fixed-height
    // container, so the default `stretch` sizes it to the VISIBLE height — a taller document then
    // scrolls out of the painted area. Flooring it at its own content height lets it grow past
    // that, while stretch still fills a widget that is taller than its content (dynamic height
    // with a short document), which a percentage min-height could not do: percentages resolve
    // against an `auto` parent height as zero.
    minHeight: 'max-content',
  };

  const isInitialRender = useRef(true);
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';

  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const heightChangeValue = useHeightObserver(wrapperRef, isDynamicHeightEnabled);

  const [rawHtml, setRawHtml] = useState('');
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isVisible: visibility,
    isLoading: loadingState,
    isDisabled: disabledState,
    rawHTML: stringifyHTML || '',
  });

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    currentLayout,
    width,
    visibility: exposedVariablesTemporaryState.isVisible,
    subContainerIndex,
    componentType,
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

  // index.ejs sets `<base href="/">`, and a fragment-only href resolves against the BASE url rather than the current page.
  // so an authored `#test` link resolves to `/#test` and leaves the app for the dashboard instead of scrolling.
  // Handle the click here and scroll to the target ourselves, and every link that is not in-page is left to the browser.
  //
  // The search is bounded by the nearest canvas rather than the document, so a link can reach a heading in another widget.
  // — which is the native behaviour an author expects
  // — `closest` also means a widget inside a Modal or Tab searches that nested canvas rather than the whole page.
  const handleAuthoredClick = (event) => {
    const anchor = event.target.closest?.('a[href^="#"]');
    if (!anchor || !contentRef.current?.contains(anchor)) return;

    event.preventDefault();
    const fragment = anchor.getAttribute('href').slice(1);
    if (!fragment) {
      // `href="#"` conventionally means "back to the top".
      contentRef.current.scrollIntoView({ block: 'start' });
      return;
    }
    const searchRoot = contentRef.current.closest('.real-canvas') ?? contentRef.current;
    const escape = (value) => (window.CSS?.escape ? window.CSS.escape(value) : value);
    const find = (value) => searchRoot.querySelector(`#${escape(value)}, [name="${escape(value)}"]`);

    // A fragment is percent-encoded in the href but the id is not: `#caf%C3%A9` points at `id="café"`.
    // Try the literal first so an id that really contains a `%` still wins, then the decoded form.
    let target = find(fragment);
    if (!target) {
      try {
        const decoded = decodeURIComponent(fragment);
        if (decoded !== fragment) target = find(decoded);
      } catch {
        // Malformed encoding: nothing to scroll to.
      }
    }
    target?.scrollIntoView({ block: 'start' });
  };

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
      ref={wrapperRef}
      className={cx('jet-container', 'html-widget-container', {
        'dynamic-height': isDynamicHeightEnabled,
        'jet-container-loading': exposedVariablesTemporaryState.isLoading,
      })}
      data-disabled={exposedVariablesTemporaryState.isDisabled}
      aria-disabled={exposedVariablesTemporaryState.isDisabled}
      inert={exposedVariablesTemporaryState.isDisabled ? '' : undefined}
      style={{
        background: exposedVariablesTemporaryState.isLoading && 'var(--cc-surface1-surface)',
        display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
        border: exposedVariablesTemporaryState.isLoading && '1px solid var(--cc-default-border)',
        borderRadius: exposedVariablesTemporaryState.isLoading && '6px',
        width: '100%',
        height: isDynamicHeightEnabled ? 'auto' : height,
        ...(isDynamicHeightEnabled && { minHeight: height }), // overflow-y is driven by the `dynamic-height` class in html.scss
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
          ref={contentRef}
          onClick={handleAuthoredClick}
          style={baseStyle}
          dangerouslySetInnerHTML={{ __html: sanitizeAuthoredHtml(rawHtml) }}
        />
      )}
    </div>
  );
};
