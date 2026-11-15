// Selectors for the JSON Editor widget (frontend/src/AppBuilder/Widgets/JSONEditor/JSONEditor.jsx, CodeMirror 6).
// Pass the runtime name (e.g. "jsoneditor1"). RenderWidget puts data-cy="draggable-widget-<name>" on the inner
// `.canvas-component` node; nothing inside the widget carries a data-cy, so the editor parts are reached through
// the widget's own `.json-editor-widget` class (JSONEditor.jsx:301) and CodeMirror's stable `cm-*` classes.
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;
const box = (name) => `${widget(name)} .json-editor-widget`;

export const jsonEditorSelector = {
  // RenderWidget's inner node: takes the `disabled` class (RenderWidget.jsx:333) and the global
  // `.disabled { pointer-events: none; opacity: 0.5 }` rule (theme.scss:3851-3854)
  draggableWidget: widget,
  // JSONEditor.jsx:301 — the container that carries the inline height/background/border/visibility styles
  box,
  // CodeMirror's root (theme class + theme background), its scroller (jsonEditor.scss:23-28),
  // the sticky gutter strip (jsonEditor.scss:13-21) and the line-number column inside it
  editor: (name) => `${box(name)} .cm-editor`,
  scroller: (name) => `${box(name)} .cm-scroller`,
  gutters: (name) => `${box(name)} .cm-gutters`,
  lineNumbers: (name) => `${box(name)} .cm-lineNumbers`,
  // the contenteditable document (editable={!isDisabled} — JSONEditor.jsx:328) and its rendered lines
  content: (name) => `${box(name)} .cm-content`,
  line: (name) => `${box(name)} .cm-line`,
  // fold gutter (basicSetup.foldGutter — JSONEditor.jsx:106): open nodes carry title "Fold line",
  // folded ones "Unfold line"; a folded range renders an inline placeholder that unfolds on click
  foldMarker: (name) => `${box(name)} .cm-foldGutter span[title="Fold line"]`,
  unfoldMarker: (name) => `${box(name)} .cm-foldGutter span[title="Unfold line"]`,
  foldPlaceholder: (name) => `${box(name)} .cm-foldPlaceholder`,
  // lintGutter() (JSONEditor.jsx:190): the error marker and the tooltip it opens on hover
  lintMarker: (name) => `${box(name)} .cm-lint-marker-error`,
  lintTooltip: (name) => `${box(name)} .cm-tooltip-lint`,
  diagnostic: (name) => `${box(name)} .cm-tooltip-lint .cm-diagnostic-error`,
  // the native <input> of a TextInput helper widget
  textInput: (name) => `${widget(name)} input`,
};
