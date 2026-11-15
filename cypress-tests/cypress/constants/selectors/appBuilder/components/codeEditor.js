// Selectors for the Code Editor widget (frontend/src/AppBuilder/Widgets/CodeEditor.jsx).
// Pass the runtime name (e.g. "codeeditor1"). RenderWidget passes dataCy = componentName; CodeEditor.jsx:104
// puts it on its outer wrapper, so the CodeMirror parts below are reached by class under the grid box.
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;

export const codeEditorSelector = {
  // WidgetWrapper grid box — the one the layout engine sizes and moves
  draggableWidget: widget,
  // CodeEditor.jsx:104 — outer wrapper (inline display none/block for visibility)
  root: (name) => `[data-cy="${name}"]`,
  // CodeEditor.jsx:105-120 — the bordered editor box (inline height / min-height / max-height 320px)
  box: (name) => `${widget(name)} .code-editor-widget`,
  // CodeMirror parts rendered by @uiw/react-codemirror (CodeEditor.jsx:121-135) — no data-cy of their own
  editor: (name) => `${widget(name)} .cm-editor`,
  scroller: (name) => `${widget(name)} .cm-scroller`,
  content: (name) => `${widget(name)} .cm-content`,
  line: (name) => `${widget(name)} .cm-line`,
  gutters: (name) => `${widget(name)} .cm-gutters`,
  lineNumber: (name) => `${widget(name)} .cm-lineNumbers .cm-gutterElement`,
  matchingBracket: (name) => `${widget(name)} .cm-matchingBracket`,
  autocomplete: (name) => `${widget(name)} .cm-tooltip-autocomplete`,
  autocompleteOption: (name) => `${widget(name)} .cm-tooltip-autocomplete li`,
  // helper widgets
  textInput: (name) => `${widget(name)} input`,
};
