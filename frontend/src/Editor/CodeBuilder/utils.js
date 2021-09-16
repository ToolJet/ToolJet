import _ from 'lodash';
import Fuse from 'fuse.js';

export function getSuggestionKeys(currentState) {
  let suggestions = [];
  _.keys(currentState).forEach((key) => {
    _.keys(currentState[key]).forEach((key2) => {
      _.keys(currentState[key][key2]).forEach((key3) => {
        suggestions.push(`${key}.${key2}.${key3}`)
      })
    })
  });
  return suggestions;
}

export function generateHints(word, suggestions) {

  if(word === '') {
    return suggestions;
  }

  const fuse = new Fuse(suggestions);
  return fuse.search(word).map((result) => result.item);
}

export function computeCurrentWord(editor, _cursorPosition, ignoreBraces = false) {
  const cursor = editor.getCursor();
  const line = cursor.line;
  const value = editor.getLine(line);
  const sliced = value.slice(0, _cursorPosition);

  const splitter = ignoreBraces ? ' ' : '{{';

  const split = sliced.split(splitter);
  const lastWord = split[split.length - 1];
  return lastWord;
}

export function makeOverlay(style) {
  return {
    token: function (stream, state) {
      var ch;
      if (stream.match("{{")) {
        while ((ch = stream.next()) != null)
          if (ch == "}" && stream.next() == "}") {
            stream.eat("}");
            return style;
          }
      }
      while (stream.next() != null && !stream.match("{{", false)) { }
      return null;
    }
  }
}

export function onBeforeChange(editor, change, ignoreBraces = false) {

  if(!ignoreBraces) { 

    const cursor = editor.getCursor();
    const line = cursor.line;
    const ch = cursor.ch;
    const value = editor.getLine(line);
    const isLastCharacterBrace = value.slice(ch - 1, value.length) === '{';

    if (isLastCharacterBrace && change.origin === '+input' && change.text[0] === '{') {
      change.text[0] = '{}}'
      // editor.setCursor({ line: 0, ch: ch })
    }

  }

  return change;
}

export function canShowHint(editor, ignoreBraces = false) {
  
  if(!editor.hasFocus()) return false;

  const cursor = editor.getCursor();
  const line = cursor.line;
  const ch = cursor.ch;
  const value = editor.getLine(line);

  if(ignoreBraces && value.length > 0) return true;

  return value.slice(ch, ch + 2) === '}}';
}

export function handleChange(editor, onChange, suggestions, ignoreBraces = false) {

  let state = editor.state.matchHighlighter;
  editor.addOverlay(state.overlay = makeOverlay(state.options.style));

  const cursor = editor.getCursor();
  const currentWord = computeCurrentWord(editor, cursor.ch, ignoreBraces);
  const hints = generateHints(currentWord, suggestions);

  const options = {
    alignWithWord: true,
    completeSingle: false,
    hint: function () {
      return {
        from: { line: cursor.line, ch: cursor.ch - currentWord.length },
        to: cursor,
        list: hints
      }
    }
  };
  if (canShowHint(editor, ignoreBraces)) {
    editor.showHint(options);
  }
};
