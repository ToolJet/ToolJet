// Renderable stand-in for `react-markdown`.
//
// Why a stub and not a transform: react-markdown's dependency tree is ~30
// ESM-only packages (unified/micromark/mdast/hast/vfile...). Adding them to
// `esmPackages` works but costs ~45s of extra Babel work on a cold run, for
// every suite that touches a widget importing Text.jsx. No App Builder test
// asserts on markdown *syntax* — they assert the widget shows its text — so a
// pass-through component preserves everything the tests actually observe.
//
// It renders children as-is, which is exactly right for the plain-string
// content widgets pass in, and drops markdown-only props (remarkPlugins,
// rehypePlugins, components, ...) so React does not warn about unknown DOM
// attributes.
const React = require('react');

const ReactMarkdown = ({ children }) => {
  // Faithful to the real library's one hard precondition, so a value it would
  // reject fails here too. react-markdown/lib/index.js:266-276 does exactly
  // this: `children || ''` first — so falsy non-strings (0, false, null) are
  // coerced and safe — then `unreachable()` on anything still not a string.
  //
  // The pass-through this replaces accepted ANY value, which is why a widget
  // handing the renderer a number looked fine under jest while crashing the
  // real canvas. Keep this check: it is the only thing standing in for the
  // library in every markdown spec in the repo.
  const value = children || '';
  if (typeof value !== 'string') {
    throw new Error('Unexpected value `' + value + '` for `children` prop, expected `string`');
  }
  return React.createElement('div', { 'data-testid': 'react-markdown' }, value);
};

module.exports = ReactMarkdown;
module.exports.default = ReactMarkdown;
