import React, { useRef } from 'react';
import CodeHints from './CodeHints';

const SingleLineCodeEditor = (props) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const [currentValue, setCurrentValue] = React.useState('');

  const handleInputChange = (value) => {
    setCurrentValue(value);
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

  return (
    <div className="code-editor-basic-wrapper">
      <div className="field code-editor-basic-label">{props?.paramLabel}</div>
      <CodeHints isFocused={isFocused} setFocus={setIsFocused} currentValue={currentValue}>
        <div className="codehinter-container w-100 p-2">
          <div className={'code-hinter-vertical-line'}></div>

          <SingleLineCodeEditor.Editor setValue={handleInputChange} setCaretPosition={setCaretPosition} />
        </div>
      </CodeHints>
    </div>
  );
};

const EditorInput = ({ setValue, setCaretPosition }) => {
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
      setValue(rawText);
    }
  };

  return <div contentEditable ref={editableDivRef} onInput={handleInputChange} className="codehinter-input"></div>;
};

SingleLineCodeEditor.Editor = EditorInput;

export default SingleLineCodeEditor;
