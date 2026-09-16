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

const ReactMarkdown = ({ children }) => React.createElement('div', { 'data-testid': 'react-markdown' }, children);

module.exports = ReactMarkdown;
module.exports.default = ReactMarkdown;
