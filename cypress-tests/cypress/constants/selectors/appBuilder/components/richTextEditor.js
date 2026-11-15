// Selectors for the Text Editor widget (RichTextEditor — frontend/src/AppBuilder/Widgets/RichTextEditor.jsx + DraftEditor.jsx).
// Pass the runtime name (e.g. "richtexteditor1"). RenderWidget passes dataCy = componentName; RichTextEditor.jsx:82 puts
// it on its outer wrapper. Nothing inside the draft-js editor or its toolbar carries a data-cy, so the parts below are
// reached by class under the grid box.
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;

export const richTextEditorSelector = {
  // WidgetWrapper grid box — the one the layout engine sizes and moves
  draggableWidget: widget,
  // RichTextEditor.jsx:74-89 — outer wrapper (data-disabled / aria-disabled / inline height + display)
  root: (name) => `[data-cy="${name}"]`,
  // DraftEditor.jsx:294 — bordered root that holds the toolbar and the editor
  editorRoot: (name) => `${widget(name)} .RichEditor-root`,
  // DraftEditor.jsx:295 — toolbar
  controls: (name) => `${widget(name)} .RichEditor-controls`,
  // DraftEditor.jsx:88-104 — hover-opened "Heading" menu (H1..H6)
  headingMenu: (name) => `${widget(name)} .dropmenu`,
  headingButton: (name) => `${widget(name)} .dropmenu .dropdownbtn`,
  headingList: (name) => `${widget(name)} .dropmenu .dropdown-content`,
  // DraftEditor.jsx:46 — every toolbar style button (headings, block types, inline styles)
  styleButton: (name) => `${widget(name)} .RichEditor-styleButton`,
  activeStyleButton: (name) => `${widget(name)} .RichEditor-activeButton`,
  // DraftEditor.jsx:64-79,121-131 — icon-only buttons, identified by their icon file
  iconButton: (name, icon) => `${widget(name)} .RichEditor-styleButton:has(img[src$="/${icon}.svg"])`,
  // DraftEditor.jsx:299-307 — editor container (inline height; auto with dynamic height)
  editorContainer: (name) => `${widget(name)} .RichEditor-editor`,
  // draft-js Editor (DraftEditor.jsx:308-324) — the contentEditable and its blocks
  content: (name) => `${widget(name)} .public-DraftEditor-content`,
  block: (name) => `${widget(name)} .public-DraftEditor-content [data-block="true"]`,
  placeholder: (name) => `${widget(name)} .public-DraftEditorPlaceholder-root`,
  // helper widgets
  textInput: (name) => `${widget(name)} input`,
};
