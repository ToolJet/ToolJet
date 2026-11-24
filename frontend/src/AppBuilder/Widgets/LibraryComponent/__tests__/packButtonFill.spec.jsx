import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { componentSettings, installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 9: a pack button made taller in the editor grew only its box; the button inside kept its own height (an Ant
// Button 32px in a 50px box, an MUI one 37px in 120px), where a native Button and the Rocket Button take the box's
// height. Every pack component drawn as one button in its box now fills the box's height: the Ant and MUI Buttons,
// the Dialog, Modal and Drawer trigger buttons, and the dropdown menu trigger buttons. The real components, inline
// SDK and host; only module and CSS loading is replaced. jsdom has no layout, so the oracle is what the pack's own
// stylesheet computes for the rendered markup (copied out of the shadow root); the browser check covers the rest.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACKS = path.resolve(__dirname, '../../../../../../packs');
// jsdom's CSS parser rejects a whole stylesheet with an @container rule in it (the Ant calendar's), so those blocks,
// none of them about buttons, are left out.
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
const css = (pack, files) =>
  withoutContainerQueries(
    files.map((file) => fs.readFileSync(path.join(PACKS, pack, 'src/styles', file), 'utf8')).join('\n')
  );
const PACK = {
  shadcn: {
    source: require('../../../../../../packs/shadcn/src/index.ts'),
    css: css('shadcn', ['ui.css', 'ui2-nav.css']),
  },
  antd: { source: require('../../../../../../packs/antd/src/index.ts'), css: css('antd', ['pack.css']) },
  mui: { source: require('../../../../../../packs/mui/src/index.ts'), css: css('mui', ['pack.css']) },
};

afterEach(cleanup);

let serial = 0;
// Renders a pack component, then copies its markup out of the shadow root, under the pack's stylesheet, so jsdom can
// compute the stylesheet against it.
async function mount(pack, name, props = {}) {
  loadLibraryModule.mockResolvedValue(PACK[pack].source);
  const cy = `fill-${++serial}`;
  const view = render(
    <InlineLibraryComponent
      bundleUrl={`${pack}.js`}
      cssUrl={`${pack}.css`}
      cacheKey={`button-fill-${serial}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={cy}
      fireEvent={() => {}}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="${cy}"]`)?.shadowRoot?.querySelector('.tj-cc-root');
  await waitFor(() => expect(root()?.querySelector('button')).toBeTruthy());
  const holder = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = PACK[pack].css;
  holder.appendChild(style);
  holder.insertAdjacentHTML('beforeend', root().innerHTML);
  document.body.appendChild(holder);
  return { holder, done: () => holder.remove() };
}

const heightOf = (el) => getComputedStyle(el).height;

describe.each([
  ['shadcn', 'Button', {}, 'button.ui-btn'],
  ['shadcn', 'Dialog', {}, 'button.ui-btn'],
  ['shadcn', 'DropdownMenu', {}, 'button.ui-btn'],
  ['antd', 'Button', { children: 'Save' }, '.ant-btn'],
  ['antd', 'Modal', {}, '.ant-btn'],
  ['antd', 'Drawer', {}, '.ant-btn'],
  ['antd', 'Dropdown', {}, '.ant-btn'],
  ['mui', 'Button', { children: 'Save' }, '.MuiButton-root'],
  ['mui', 'Button', { children: 'Save', tooltip: 'Saves it' }, '.MuiButton-root'],
  ['mui', 'Dialog', {}, '.MuiButton-root'],
  ['mui', 'Menu', {}, '.MuiButton-root'],
])('%s %s %j', (pack, name, props, selector) => {
  test('the button takes the height of its box', async () => {
    // Break this catches: the button keeping its own height (its Size's) while its box is made taller.
    const { holder, done } = await mount(pack, name, props);
    const button = holder.querySelector(selector);

    expect(button).toBeTruthy();
    expect(heightOf(button)).toBe('100%');
    done();
  });
});

describe('a split Ant Dropdown (a button and an arrow button)', () => {
  test('both buttons and their group take the height of the box', async () => {
    // Break this catches: the split dropdown left at Ant's height beside every other pack button that fills its box.
    const { holder, done } = await mount('antd', 'Dropdown', { split: true });
    const buttons = [...holder.querySelectorAll('.ant-btn')];

    expect(buttons).toHaveLength(2);
    expect(heightOf(holder.querySelector('.ant-space-compact'))).toBe('100%');
    buttons.forEach((button) => expect(heightOf(button)).toBe('100%'));
    done();
  });
});

describe('a Rocket Dropdown Menu shown as an icon', () => {
  test('keeps its square icon button rather than stretching it to the box', async () => {
    // Break this catches: the icon-only trigger, 36px wide, drawn as a tall thin bar in a tall box.
    const { holder, done } = await mount('shadcn', 'DropdownMenu', { triggerType: 'icon' });

    expect(heightOf(holder.querySelector('button.ui-btn'))).not.toBe('100%');
    done();
  });
});

describe('a new MUI Button', () => {
  test('starts in the 40px box (4 rows) every other pack button starts in', () => {
    // Break this catches: the 50px box kept from when the button had its own height (so Large fit), which now draws
    // every new MUI Button 10px taller than the rest.
    expect(componentSettings(PACK.mui.source.Button).defaultHeight).toBe(4);
  });
});
