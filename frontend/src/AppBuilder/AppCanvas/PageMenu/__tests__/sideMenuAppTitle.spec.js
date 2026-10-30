/**
 * With the page menu at the side, a long app title was cut to one line with an ellipsis ("test-navigationadsfkjha..."),
 * losing everything past about 30 characters: the header was a fixed 80px and the title nowrap. It now wraps onto more
 * lines and the header grows with it. The top bar keeps the title to one line, as before. jsdom has no layout: the
 * rules that make it are checked here, and the drawn result in a browser (see the report).
 */
import fs from 'fs';
import path from 'path';

const scss = fs.readFileSync(path.join(__dirname, '../../../../_styles/pages-sidebar.scss'), 'utf8');
const block = (text, selector) => {
  const start = text.indexOf(`${selector} {`);
  let depth = 0;
  for (let i = text.indexOf('{', start); i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}' && --depth === 0) return text.slice(start, i + 1);
  }
  return '';
};
// A block's own declarations, without its nested blocks.
const own = (text) => {
  let inner = text.slice(text.indexOf('{') + 1, text.lastIndexOf('}'));
  while (/[^{};]*\{[^{}]*\}/.test(inner)) inner = inner.replace(/[^{};]*\{[^{}]*\}/g, '');
  return inner;
};

describe('the app title in the page menu', () => {
  const side = block(scss, '#sidebar-page-navigation');
  const sideName = block(side, '.app-name');

  it('wraps at the side, and the header grows with it', () => {
    const text = own(block(sideName, '.app-text'));
    expect(text).toMatch(/white-space: normal;/);
    expect(text).toMatch(/overflow-wrap: anywhere;/);
    expect(text).not.toMatch(/text-overflow: ellipsis/);
    expect(own(sideName)).toMatch(/min-height: 80px;/);
    expect(own(sideName)).not.toMatch(/(^|[^-])height: 80px;/);
  });

  it('keeps to one line in the top bar', () => {
    const top = block(side, '&.position-top');
    const text = own(block(block(top, '.app-name'), '.app-text'));
    expect(text).toMatch(/white-space: nowrap;/);
    expect(text).toMatch(/text-overflow: ellipsis;/);
  });
});
