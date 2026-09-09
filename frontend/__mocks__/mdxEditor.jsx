// Renderable stand-in for `@mdxeditor/editor`.
//
// Why a stub and not a transform: the package is ESM-only and pulls the whole
// Lexical editor tree, which is far larger than the react-markdown tree that
// is already stubbed for the same reason. Nothing in the App Builder Jest
// suites asserts on rich-text editing — it is reached only because the EE
// AiBuilder doc previewer sits on an import chain the widget canvas walks
// (`AppCanvas/WidgetWrapper` -> editor UI) — so a pass-through component plus
// no-op plugin factories preserve everything the tests actually observe.
//
// A Proxy covers the plugin factories so a newly imported `somethingPlugin`
// does not need to be added here by hand.
const React = require('react');

const MDXEditor = React.forwardRef(({ markdown, children }, ref) =>
  React.createElement('div', { 'data-testid': 'mdx-editor', ref }, markdown ?? children ?? null)
);
MDXEditor.displayName = 'MDXEditor';

const noopPlugin = () => ({});

module.exports = new Proxy(
  { MDXEditor, default: MDXEditor, __esModule: true },
  {
    get(target, property) {
      if (property in target) return target[property];
      // Plugin factories and helpers: callable, harmless, and never asserted.
      return noopPlugin;
    },
  }
);
