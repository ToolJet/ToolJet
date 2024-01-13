import React, { useEffect, useRef, useState } from 'react';

import { generateSuggestiveHints } from './utils';
import { useHotkeysContext } from 'react-hotkeys-hook';

import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import SuggestionsList from './Suggestions';

const SingleLineCodeEditor = ({ paramLabel, suggestions, componentName }) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const [currentValue, setCurrentValue] = React.useState('');

  const [hints, setHints] = React.useState([]);

  const handleInputChange = (value) => {
    setCurrentValue(value);

    const actualInput = value.replace(/{{|}}/g, '');

    const hints = generateSuggestiveHints(suggestions['appHints'], actualInput);

    setHints(hints);
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

  const { enableScope, disableScope, enabledScopes } = useHotkeysContext();

  const [shouldShowSuggestions, setShouldShowSuggestions] = useState(false);
  const hintsActiveRef = useRef(false);

  useEffect(() => {
    if (!hintsActiveRef.current && currentValue.startsWith('{{') && currentValue.endsWith('}}')) {
      setShouldShowSuggestions(true);
      hintsActiveRef.current = true;
    }
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
  }, [shouldShowSuggestions]);

  //   const [show, setShow] = useState(false);
  const [target, setTarget] = useState(null);
  const ref = useRef(null);

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
  }, [ref.current]);

  return (
    <div ref={ref} className={`code-editor-container-${componentName}`}>
      <div className="code-editor-basic-wrapper">
        <div className="field code-editor-basic-label">{paramLabel}</div>
        <div className="codehinter-container w-100 p-2">
          <div className={'code-hinter-vertical-line'}></div>

          <SingleLineCodeEditor.Editor
            setValue={handleInputChange}
            setCaretPosition={setCaretPosition}
            suggestions={suggestions}
            setIsFocused={handleClick}
          />
        </div>
      </div>

      <Overlay show={shouldShowSuggestions} target={target} placement="bottom" container={ref} containerPadding={20}>
        <Popover
          id="popover-contained"
          style={{ width: '250px', maxWidth: '350px', maxHeight: '200px', overflowY: 'auto' }}
        >
          <Popover.Header as="h3">Popover bottom</Popover.Header>
          <Popover.Body>
            <div className={'tj-app-input-suggestions'}>
              <SuggestionsList hints={hints} />
            </div>
          </Popover.Body>
        </Popover>
      </Overlay>
    </div>
  );
};

const EditorInput = ({ setValue, setCaretPosition, setIsFocused }) => {
  const editableDivRef = useRef(null);
  const ignoreNextInputEventRef = useRef(false);

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

  const handleInputChange = (event) => {
    if (ignoreNextInputEventRef.current) {
      ignoreNextInputEventRef.current = false;
      return;
    }

    let rawText = event.target.innerText;

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
  };

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
