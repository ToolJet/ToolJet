/* eslint-disable import/no-unresolved */
import React, { useState, useEffect, useMemo } from 'react';
import { useFormClear } from '@/AppBuilder/Widgets/Form/FormSignalContext';
import CodeMirror from '@uiw/react-codemirror';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { javascript } from '@codemirror/lang-javascript';
import { tooltips } from '@codemirror/view';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { sass } from '@codemirror/lang-sass';
import { debounce } from 'lodash';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import './codeEditor.scss';

// CodeMirror renders tooltips inside the editor unless told otherwise,
// and this widget's scroll container is `overflow: auto` with a max height
// so the autocomplete list was cropped at the editor's edge and put a scrollbar on the editor
const tooltipExtension = tooltips({ parent: document.body });

const langSupport = Object.freeze({
  javascript: javascript(),
  python: python(),
  sql: sql(),
  jsx: javascript({ jsx: true }),
  css: sass(),
});

const CodeEditor = ({
  id,
  height,
  darkMode,
  properties,
  styles,
  setExposedVariable,
  dataCy,
  currentLayout,
  width,
  currentMode,
  subContainerIndex,
  componentType,
}) => {
  const { enableLineNumber, mode, placeholder } = properties;
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const { visibility, disabledState } = styles;
  const [forceDynamicHeightUpdate, setForceDynamicHeightUpdate] = useState(false);
  const [value, setValue] = useState('');

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: forceDynamicHeightUpdate,
    currentLayout,
    width,
    visibility,
    subContainerIndex,
    componentType,
  });

  // Memoized so there is ONE debounced write to cancel.
  // Built in the component body it was rebuilt every render, leaving a separate pending timer per keystroke.
  const codeChanged = useMemo(
    () =>
      debounce((code) => {
        setExposedVariable('value', code);
      }, 500),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => () => codeChanged.cancel(), [codeChanged]);

  const updateValue = (val) => {
    setValue(val);
    setForceDynamicHeightUpdate((prev) => !prev);
    codeChanged(val);
  };

  const editorStyles = {
    height: isDynamicHeightEnabled ? '100%' : height,
    display: !visibility ? 'none' : 'block',
  };

  const setupConfig = {
    lineNumbers: enableLineNumber ?? true,
    syntaxHighlighting: true,
    bracketMatching: true,
    foldGutter: true,
    highlightActiveLine: false,
    autocompletion: true,
    highlightActiveLineGutter: false,
    completionKeymap: true,
    searchKeymap: false,
  };

  const theme = darkMode ? okaidia : githubLight;
  const langExtention = langSupport?.[mode?.toLowerCase()];

  const editorHeight = React.useMemo(() => {
    return isDynamicHeightEnabled ? 'auto' : height || 'auto';
  }, [height, isDynamicHeightEnabled]);

  useEffect(() => {
    // Mirrors the JSON Editor's rule so the two widgets coerce identically: an object becomes
    // pretty-printed JSON, anything else goes through String(). The previous `typeof value ===
    // 'string'` guard dropped everything else silently, so a query returning a number or an object
    // set nothing and said nothing. Note this renders `null` as the text `null`; clearing the
    // editor is `setValue('')`.
    const asText = (value) => {
      if (typeof value === 'object' && value !== null) {
        try {
          return JSON.stringify(value, null, 2);
        } catch {
          // Circular references, BigInt and throwing getters all make JSON.stringify throw. Falling
          // back keeps a bad argument from taking the widget down mid-render.
          return String(value);
        }
      }
      return String(value);
    };

    const _setValue = (rawValue) => {
      const value = asText(rawValue);
      {
        // Publish NOW rather than through the typing debounce. A single click can run several
        // handlers back to back — set this editor, then read `components.<id>.value` into a
        // variable — and a debounced write would not have landed by the time the next handler
        // reads, handing it the previous text. A programmatic set is one deliberate write, not a
        // stream of keystrokes, so it does not need throttling.
        codeChanged.cancel(); // a keystroke write still pending would otherwise land after this
        setExposedVariable('value', value);
        setValue(value);
        setForceDynamicHeightUpdate((prev) => !prev);
      }
    };
    setExposedVariable('setValue', _setValue);

    // Publish the starting value
    setExposedVariable('value', value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFormClear(() => updateValue(''));

  return (
    <div data-disabled={disabledState} style={editorStyles} data-cy={dataCy}>
      <div
        className={`code-hinter codehinter-default-input code-editor-widget scrollbar-container`}
        style={{
          height: isDynamicHeightEnabled ? '100%' : height || '100%',
          ...(isDynamicHeightEnabled
            ? { minHeight: height - 1, maxHeight: '100%', overflow: 'auto' }
            : { minHeight: height - 1, maxHeight: '320px', overflow: 'auto' }),
          borderRadius: `${styles.borderRadius}px`,
          boxShadow: styles.boxShadow,
          border: `1px solid ${styles.borderColor}`,
          '--cc-code-editor-min-height': `${height - 1}px`,
          '--cc-code-editor-background-color': styles.backgroundColor,
        }}
      >
        <CodeMirror
          value={value}
          placeholder={placeholder}
          height={'100%'}
          minHeight={isDynamicHeightEnabled ? `${height}px` : editorHeight}
          maxHeight={isDynamicHeightEnabled ? 'none' : editorHeight}
          width="100%"
          theme={theme}
          extensions={[langExtention ?? javascript(), tooltipExtension]}
          onChange={updateValue}
          basicSetup={setupConfig}
          className={`codehinter-multi-line-input code-editor-component`}
          indentWithTab={true}
          editable={!disabledState}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
