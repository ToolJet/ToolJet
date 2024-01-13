import React, { useEffect, useRef, useState } from 'react';
import { generateSuggestiveHints } from './utils';
import { useHotkeysContext } from 'react-hotkeys-hook';
import CodeHints from './CodeHints';
import { PreviewBox } from './PreviewBox';
import { ToolTip } from '@/Editor/Inspector/Elements/Components/ToolTip';
import { useTranslation } from 'react-i18next';
import { camelCase } from 'lodash';

const SingleLineCodeEditor = ({ paramLabel, suggestions, componentName, darkMode, fieldMeta }) => {
  const { enableScope, disableScope, enabledScopes } = useHotkeysContext();
  const { t } = useTranslation();

  const [isFocused, setIsFocused] = React.useState(false);
  const [shouldShowSuggestions, setShouldShowSuggestions] = useState(false);
  const [target, setTarget] = useState(null);

  const [currentValue, setCurrentValue] = React.useState('');

  const hintsActiveRef = useRef(false);
  const ref = useRef(null);

  const [hints, setHints] = React.useState([]);

  const handleInputChange = (value) => {
    setCurrentValue(value);

    const actualInput = value.replace(/{{|}}/g, '');

    const hints = generateSuggestiveHints(suggestions['appHints'], actualInput);

    setHints(hints);
  };

  const updateValueFromHint = (hintValue) => {
    const currentValueWithoutBraces = currentValue.replace(/{{|}}/g, '');
    const value = currentValueWithoutBraces + hintValue;

    const withBraces = `{{${value}}}`;

    setCurrentValue(withBraces);

    setShouldShowSuggestions(false);
  };

  function setCaretPosition(editableDiv, position) {
    const setRange = (node, pos) => {
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStart(node, pos);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    };

    const walkNode = (node, position) => {
      let currentLength = 0;
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          if (currentLength + child.length >= position) {
            setRange(child, position - currentLength);
            return true;
          }
          currentLength += child.length;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (walkNode(child, position - currentLength)) {
            return true;
          }
          currentLength += child.innerText.length;
        }
      }
      return false;
    };

    walkNode(editableDiv, position);
  }

  useEffect(() => {
    if (!hintsActiveRef.current && currentValue.startsWith('{{') && currentValue.endsWith('}}')) {
      setShouldShowSuggestions(true);
      hintsActiveRef.current = true;
    } else {
      hintsActiveRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  useEffect(() => {
    if (shouldShowSuggestions) {
      enableScope('codehinter');
      disableScope('editor');
    }

    if (!shouldShowSuggestions) {
      const hinterScopeActive = enabledScopes.includes('codehinter');

      if (hinterScopeActive) {
        disableScope('codehinter');
        enableScope('editor');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShowSuggestions]);

  const handleClick = (event) => {
    setIsFocused((prev) => !prev);
    setTarget(event.target);
  };

  useEffect(() => {
    if (currentValue.startsWith('{{')) {
      setShouldShowSuggestions(true);
      hintsActiveRef.current = true;
    }
  }, [currentValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current !== event.target) {
        setShouldShowSuggestions(false);
        setIsFocused(false);
        hintsActiveRef.current = false;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current]);

  return (
    <CodeHints
      ref={ref}
      componentName={componentName}
      target={target}
      shouldShowSuggestions={shouldShowSuggestions}
      hints={hints}
      updateValueFromHint={updateValueFromHint}
    >
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
          <div className="codehinter-container w-100 px-3">
            <SingleLineCodeEditor.Editor
              currentValue={currentValue}
              setValue={handleInputChange}
              setCaretPosition={setCaretPosition}
              suggestions={suggestions}
              setIsFocused={handleClick}
            />
            {currentValue.length > 0 && (
              <PreviewBox currentValue={currentValue} isFocused={isFocused} componentName={componentName} />
            )}
          </div>
        </div>
      </div>
    </CodeHints>
  );
};

const EditorInput = ({ currentValue, setValue, setCaretPosition, setIsFocused }) => {
  const editableDivRef = useRef(null);
  const ignoreNextInputEventRef = useRef(false);

  const [localValue, setLocalValue] = useState('');

  const formatText = (rawText) => {
    // Split text into parts and wrap {{ and }} in spans
    const parts = rawText.split(/(\{\{|\}\})/);
    return parts
      .map((part) => {
        if (part === '{{' || part === '}}') {
          return `<span class="curly-braces">${part}</span>`;
        }
        return part; // Keep other text as is
      })
      .join('');
  };

  const handleChange = (rawText) => {
    if (rawText.startsWith('{{') && !rawText.endsWith('}}')) {
      rawText = '{{}}';
    }

    const formattedText = formatText(rawText);

    if (formattedText !== editableDivRef.current.innerHTML) {
      ignoreNextInputEventRef.current = true;
      editableDivRef.current.innerHTML = formattedText;

      const shouldChangeSelection = rawText.startsWith('{{') && rawText.endsWith('}}');

      if (shouldChangeSelection) {
        editableDivRef.current.focus();
        //caret position should always be before the last curly brace
        const position = rawText.length - 2;
        setCaretPosition(editableDivRef.current, position);
      }
    }
    setValue(rawText);
    setLocalValue(rawText);
  };

  const handleInputChange = (event) => {
    if (ignoreNextInputEventRef.current) {
      ignoreNextInputEventRef.current = false;
      return;
    }

    let rawText = event.target.innerText;

    handleChange(rawText);
  };

  useEffect(() => {
    if (currentValue !== localValue) {
      handleChange(currentValue);
    }
  }, [currentValue]);

  return (
    <div
      contentEditable
      ref={editableDivRef}
      onInput={handleInputChange}
      className="codehinter-input"
      onFocus={(e) => setIsFocused(e)}
      //   onBlur={(e) => setIsFocused(e)}
      onKeyDown={(e) => {
        // if down arrow key is pressed, then prevent default behaviour
        // to prevent cursor from moving to next line
        if (e.keyCode === 40) {
          e.preventDefault();
          // and remove cursor from editable div
          editableDivRef.current.blur();
        }
      }}
    ></div>
  );
};

SingleLineCodeEditor.Editor = EditorInput;

export default SingleLineCodeEditor;
