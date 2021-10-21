import React, { useEffect, useMemo, useState } from 'react';
import { useSpring, config, animated } from 'react-spring';

import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/mode/handlebars/handlebars';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/theme/base16-light.css';
import 'codemirror/theme/duotone-light.css';
import 'codemirror/theme/monokai.css';
import { getSuggestionKeys, onBeforeChange, handleChange } from './utils';
import { resolveReferences } from '@/_helpers/utils';
import useHeight from '@/_hooks/use-height-transition';

export function CodeHinter({
  initialValue,
  onChange,
  currentState,
  mode,
  theme,
  lineNumbers,
  className,
  placeholder,
  ignoreBraces,
  enablePreview,
  height,
  minHeight,
  lineWrapping,
}) {
  const options = {
    lineNumbers: lineNumbers,
    lineWrapping: lineWrapping,
    singleLine: true,
    mode: mode || 'handlebars',
    tabSize: 2,
    theme: theme || 'default',
    readOnly: false,
    highlightSelectionMatches: true,
    placeholder,
  };

  const [realState, setRealState] = useState(currentState);
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [isFocused, setFocused] = useState(false);
  const [heightRef, currentHeight] = useHeight();
  const slideInStyles = useSpring({
    config: { ...config.stiff },
    from: { opacity: 0, height: 0 },
    to: {
      opacity: isFocused ? 1 : 0,
      height: isFocused ? currentHeight : 0,
    },
  });
  useEffect(() => {
    setRealState(currentState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState.components]);

  let suggestions = useMemo(() => {
    return getSuggestionKeys(realState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realState.components, realState.queries]);

  function valueChanged(editor, onChange, suggestions, ignoreBraces) {
    handleChange(editor, onChange, suggestions, ignoreBraces);
    setCurrentValue(editor.getValue());
  }

  const getPreviewContent = (content, type) => {
    switch (type) {
      case 'object':
        return JSON.stringify(content);
      case 'boolean':
        return content.toString();
      default:
        return content;
    }
  };

  const getPreview = () => {
    const _currentValue = ignoreBraces ? `{{${currentValue}}}` : currentValue;
    console.log('preview ==> 🚀', _currentValue);
    // console.log('preview ==> 🦑', currentValue);
    const [preview, error] = resolveReferences(_currentValue, realState, null, {}, true);

    if (error) {
      return (
        <animated.div style={{ ...slideInStyles, overflow: 'hidden' }}>
          <div ref={heightRef} className="dynamic-variable-preview bg-red-lt px-1 py-1">
            <div>
              <div className="heading my-1">
                <span>Error</span>
              </div>
              {error.toString()}
            </div>
          </div>
        </animated.div>
      );
    }

    const previewType = typeof preview;
    const content = getPreviewContent(preview, previewType);

    return (
      <animated.div style={{ ...slideInStyles, overflow: 'hidden' }}>
        <div ref={heightRef} className="dynamic-variable-preview bg-green-lt px-1 py-1">
          <div>
            <div className="heading my-1">
              <span>{previewType}</span>
            </div>
            {content}
          </div>
        </div>
      </animated.div>
    );
  };

  return (
    <>
      <div
        className={`code-hinter ${className || 'codehinter-default-input'}`}
        key={suggestions.length}
        style={{ height: height || 'auto', minHeight, maxHeight: '320px', overflow: 'auto' }}
      >
        <CodeMirror
          value={initialValue}
          realState={realState}
          scrollbarStyle={null}
          height={height}
          onFocus={() => setFocused(true)}
          onBlur={(editor) => {
            let value = editor.getValue();
            if (ignoreBraces) {
              value = resolveReferences(`{{${value}}}`, realState);
            }
            onChange(value);
            setFocused(false);
          }}
          onChange={(editor) => valueChanged(editor, onChange, suggestions, ignoreBraces)}
          options={options}
          onBeforeChange={(editor, change) => onBeforeChange(editor, change, ignoreBraces)}
        />
      </div>
      {enablePreview && getPreview()}
    </>
  );
}
