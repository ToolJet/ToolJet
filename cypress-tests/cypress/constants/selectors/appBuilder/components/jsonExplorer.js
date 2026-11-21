// Selectors for the JSON Explorer widget (frontend/src/AppBuilder/Widgets/JSONExplorer/JSONExplorer.jsx, react-json-tree).
// Pass the runtime name (e.g. "jsonexplorer1"). RenderWidget puts data-cy="draggable-widget-<name>" on the inner
// `.canvas-component` node; nothing inside the widget carries a data-cy, so the tree is reached through the widget's
// own `.json-explorer` class (JSONExplorer.jsx:174) and react-json-tree's plain UL/LI/LABEL markup.
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;
const box = (name) => `${widget(name)} .json-explorer`;

export const jsonExplorerSelector = {
  // RenderWidget's inner node: takes the `disabled` class (RenderWidget.jsx:333) and the global
  // `.disabled { pointer-events: none; opacity: 0.5 }` rule (theme.scss:3851-3854)
  draggableWidget: widget,
  // JSONExplorer.jsx:174 — the container carrying the inline height/background/border/visibility styles
  box,
  // react-json-tree's root list (background forced transparent through base00 — JSONExplorer.jsx:66-69)
  tree: (name) => `${box(name)} > ul`,
  // every rendered node row (collapsed children are NOT rendered — JSONNestedNode renderedChildren)
  node: (name) => `${box(name)} li`,
  // node key labels ("root:", "list:" …) — clicking a nested node's label toggles it (JSONNestedNode handleClick)
  label: (name) => `${box(name)} label`,
  // direct children of one nested node's <li> (react-json-tree JSONNestedNode): the arrow container (the ▶ glyph's
  // parent div — jsonExplorer.scss:19 swaps the glyph for a mask icon), the key label, the item string
  // ("{} 3 keys" / "[] 12 items") and the children list. Arrow, label and item string all toggle the node on click.
  nodePart: { arrow: "div", label: "label", itemString: "span", children: "ul" },
  // the native <input> of a TextInput helper widget, and a Button helper's <button>
  textInput: (name) => `${widget(name)} input`,
  button: (name) => `${widget(name)} button`,
};
