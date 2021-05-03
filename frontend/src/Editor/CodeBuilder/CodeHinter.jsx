import React, { PureComponent } from 'react';
import CodeMirror from '@uiw/react-codemirror';
// assuming a setup with webpack/create-react-app import the additional js/css files
import 'codemirror/mode/handlebars/handlebars';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css'; // without this css hints won't show
import _ from 'lodash';
import Fuse from 'fuse.js';

export function CodeHinter({
  initialValue, onChange, currentState
}) {

  function generateHints(word) {
    let suggestions = [];
    _.keys(currentState).forEach((key) => {
      _.keys(currentState[key]).forEach((key2) => {
        _.keys(currentState[key][key2]).forEach((key3) => {
          suggestions.push(`${key}.${key2}.${key3}`)
        })
      })
    })
    const fuse = new Fuse(suggestions);
    return fuse.search(word).map((result) => result.item);
  }

  function computeCurrentWord(value, _cursorPosition) {
    const sliced = value.slice(0, _cursorPosition);
    const split = sliced.split('{{');
    const lastWord = split[split.length - 1];
    return lastWord;
  }

  function makeOverlay(style) {
    return {token: function(stream, state) {
      var ch;
      if (stream.match("{{")) {
        while ((ch = stream.next()) != null)
          if (ch == "}" && stream.next() == "}") {
            stream.eat("}");
            return style;
          }
      }
      while (stream.next() != null && !stream.match("{{", false)) {}
      return null;
    }}
  }

  function onBeforeChange(editor, change) {
    const value = editor.getValue();
    const isLastCharacterBrace = value.slice( editor.getCursor().ch - 1, value.length) === '{';

    if(isLastCharacterBrace && change.origin === '+input') {
      change.text[0] = '{}}'
      editor.setCursor({line: 0, ch: editor.getCursor().ch})
    }

    return change;
  }

  function canShowHint(editor) {
    const value = editor.getValue()
    return value.slice(editor.getCursor().ch, editor.getCursor().ch + 2) === '}}';
  }

  function handleChange (editor) { 

    const value = editor.getValue();
    onChange(value);

    let state = editor.state.matchHighlighter;
    editor.addOverlay(state.overlay = makeOverlay( state.options.style));

    const cursor = editor.getCursor();
    const currentWord = computeCurrentWord(editor.getValue(), cursor.ch);
    const hints = generateHints(currentWord);

    const options = {
      alignWithWord: true,
      hint: function() {
         return {
          from: { line: 0, ch: cursor.ch - currentWord.length},
          to: cursor,
          list: hints
        }
      }
    };  
    if(canShowHint(editor)) {
      editor.showHint(options);
    }
  };

    const options = {
      lineNumbers: false,
      singleLine: true,
      mode: 'handlebars',
      tabSize: 2,
      readOnly: false,
      highlightSelectionMatches: true
    };

    return (
      <dib className="code-hinter">
        <div className="form-control">
          <CodeMirror
            value={initialValue}
            scrollbarStyle={null}
            onChange={handleChange}
            onBeforeChange={onBeforeChange}
            options={options}
          />
        </div>
      </dib>
    );
}