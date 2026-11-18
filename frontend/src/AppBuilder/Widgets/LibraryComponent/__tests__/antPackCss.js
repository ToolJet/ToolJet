import fs from 'fs';
import path from 'path';

// The Ant pack's own stylesheet (pack.css) for specs that check what it draws. jsdom has no layout, so the oracle is
// what the stylesheet computes for the rendered markup, copied out of the shadow root next to it.

const ANT_SRC = path.resolve(__dirname, '../../../../../../packs/antd/src');

// jsdom's CSS parser rejects a whole stylesheet with an @container rule in it, so those blocks go.
const withoutContainerQueries = (text) => {
  let out = '';
  let i = 0;
  for (let at = text.indexOf('@container', i); at !== -1; at = text.indexOf('@container', i)) {
    out += text.slice(i, at);
    let depth = 0;
    let j = text.indexOf('{', at);
    for (; j < text.length; j += 1) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}' && --depth === 0) break;
    }
    i = j + 1;
  }
  return out + text.slice(i);
};

export const ANT_PACK_CSS = withoutContainerQueries(fs.readFileSync(path.join(ANT_SRC, 'styles/pack.css'), 'utf8'));

const copies = [];

/** The component's markup (its .tj-cc-root) copied into the document under pack.css; removed by `removeCopies`. */
export const copyWithPackCss = (shadowRoot) => {
  const holder = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = ANT_PACK_CSS;
  holder.appendChild(style);
  holder.insertAdjacentHTML('beforeend', shadowRoot.querySelector('.tj-cc-root').outerHTML);
  document.body.appendChild(holder);
  copies.push(holder);
  return holder;
};

export const removeCopies = () => copies.splice(0).forEach((holder) => holder.remove());
