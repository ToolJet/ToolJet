import React from 'react';
import fs from 'fs';
import path from 'path';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 44: the MUI Key-value list drew its labels in the same colour as their values, where Rocket and Ant grey
// them. The pack is on MUI 9, whose Typography `color` prop takes only palette names (textSecondary, error): a theme
// path like "text.secondary" is dropped without a warning and the text keeps the inherited colour. Text and Heading
// already moved their colour into sx; the lists and the card grid had not, so none of their muted text was muted.
// The real pack components, inline SDK and host; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const MUI = require('../../../../../../packs/mui/src/index.ts');
const { PackSheet } = require('../../../../../../packs/mui/src/lib/emotion.ts');
const MUI_SRC = path.resolve(__dirname, '../../../../../../packs/mui/src');

afterEach(cleanup);

let serial = 0;
async function mount(name, props) {
  loadLibraryModule.mockResolvedValue({ [name]: MUI[name] });
  const cy = `mui-colors-${++serial}`;
  const view = render(
    <InlineLibraryComponent
      bundleUrl={`mui-colors-${serial}.js`}
      cssUrl={`mui-colors-${serial}.css`}
      cacheKey={`mui-colors-${serial}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={cy}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="${cy}"]`).shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-mui-root')?.childElementCount).toBeGreaterThan(0));
  await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
  // jsdom computes no style inside a shadow root (and drops the rules MUI inserts there), so the markup is copied out
  // under the rules MUI inserted and computed there.
  const holder = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = rules.join('\n');
  holder.appendChild(style);
  holder.insertAdjacentHTML('beforeend', root().querySelector('.tj-mui-root').outerHTML);
  document.body.appendChild(holder);
  copies.push(holder);
  return holder;
}
const copies = [];
// Every rule MUI's Emotion cache inserts, kept as text.
const rules = [];
const insert = PackSheet.prototype.insert;
beforeAll(() => {
  PackSheet.prototype.insert = function (rule) {
    rules.push(rule);
    return insert.call(this, rule);
  };
});
afterAll(() => {
  PackSheet.prototype.insert = insert;
});
afterEach(() => copies.splice(0).forEach((holder) => holder.remove()));

// jsdom inherits no colour, so text that sets none reads as ''. Muted text sets its own colour, and a different one
// from the text beside it.
const colorOf = (el) => getComputedStyle(el).color;
const expectMuted = (el, beside) => {
  expect(colorOf(el)).not.toBe('');
  expect(colorOf(el)).not.toBe(colorOf(beside));
};
const leafWith = (root, text) =>
  [...root.querySelectorAll('*')].find((el) => el.textContent === text && el.children.length === 0);

describe('MUI pack muted text', () => {
  test('[MUI-COLOR-001] a Key-value list greys its labels, unlike its values', async () => {
    // Break this catches: the labels drawn in the values' colour, so nothing sets them apart.
    const root = await mount('KeyValue', { data: [{ label: 'Customer', value: 'Ada Lovelace' }] });

    expectMuted(root.querySelector('.tj-mui-keyvalue__label'), leafWith(root, 'Ada Lovelace'));
  });

  test("[MUI-COLOR-009] a Key-value list draws its values in the theme's text colour", async () => {
    // Break this catches: values taking the canvas's grey-blue text colour, close to the grey labels, where MUI's own
    // text colour (or the app theme's, once applied) was meant.
    const root = await mount('KeyValue', { data: [{ label: 'Customer', value: 'Ada Lovelace' }] });
    const yes = await mount('KeyValue', { data: [{ label: 'Active', value: true, type: 'boolean' }] });
    const primary = colorOf(leafWith(yes, 'Yes'));

    expect(primary).not.toBe('');
    expect(colorOf(leafWith(root, 'Ada Lovelace'))).toBe(primary);
  });

  test('[MUI-COLOR-002] a Key-value list greys an empty value, unlike a set one', async () => {
    // Break this catches: the empty-value dash drawn as if it were a value.
    const root = await mount('KeyValue', {
      data: [
        { label: 'Plan', value: 'Pro' },
        { label: 'Notes', value: '' },
      ],
    });

    expectMuted(leafWith(root, '-'), leafWith(root, 'Pro'));
  });

  test('[MUI-COLOR-003] a Key-value list writes Yes in the text colour beside its green tick', async () => {
    // Break this catches: "Yes" taking the tick's green, where the text colour was asked for.
    const root = await mount('KeyValue', { data: [{ label: 'Active', value: true, type: 'boolean' }] });
    const yes = leafWith(root, 'Yes');

    expectMuted(yes, yes.parentElement);
  });

  test("[MUI-COLOR-004] a Progress list draws a row's percentage in its tone, and greys a plain one", async () => {
    // Break this catches: an over-budget row's percentage drawn in the plain text colour, not red.
    const root = await mount('ProgressList', {
      data: [
        { label: 'Travel', spent: 7600, budget: 6000, status: 'Over budget', note: 'Over' },
        { label: 'Training', spent: 1200, budget: 5000, note: 'Fine' },
      ],
    });
    const [toned, plain] = [...root.querySelectorAll('.tj-mui-progresslist__pct')];

    expectMuted(toned, plain);
    expectMuted(plain, leafWith(root, 'Training'));
  });

  test('[MUI-COLOR-005] a Timeline greys its times, unlike its titles', async () => {
    // Break this catches: an event's time drawn as loud as its title.
    const root = await mount('Timeline', { data: [{ title: 'Shipped', time: '2026-11-09T10:00:00' }] });

    expectMuted(root.querySelector('.tj-mui-timeline__time'), leafWith(root, 'Shipped'));
  });

  test("[MUI-COLOR-006] a Card grid greys a card's description, unlike its title", async () => {
    // Break this catches: a card's description drawn as loud as its title.
    const root = await mount('CardGrid', { dataSource: [{ id: 1, title: 'Ada', description: 'Mathematician' }] });

    expectMuted(leafWith(root, 'Mathematician'), leafWith(root, 'Ada'));
  });

  test('[MUI-COLOR-007] an empty list greys its "nothing here" text', async () => {
    // Break this catches: the empty state drawn in the plain text colour.
    const root = await mount('KeyValue', { data: [] });

    expectMuted(leafWith(root, 'No details'), root.querySelector('.tj-mui-keyvalue'));
  });

  test("[MUI-COLOR-010] a Checkbox's label takes the theme's text colour from the root, not the colour around it", async () => {
    // Break this catches: a label that sets no colour of its own taking the colour around the component, ToolJet's
    // grey-blue page text on the canvas and the container's text inside a Rocket or Ant container, so the same
    // Checkbox read differently in a container (QA: Ant Design and MUI components change look inside any Rocket
    // container).
    const root = await mount('Checkbox', {});

    expect(colorOf(leafWith(root, 'Checkbox'))).toBe('');
    expect(colorOf(root.querySelector('.tj-mui-root'))).toBe('rgba(0, 0, 0, 0.87)');
  });

  test('[MUI-COLOR-008] no MUI pack component sets a colour MUI 9 drops', () => {
    // Break this catches: a theme path ("text.secondary", `${tone}.main`) passed as a component's color prop, which
    // MUI 9 drops without a warning; it belongs in sx.
    const files = [];
    const walk = (dir) =>
      fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx$/.test(entry.name)) files.push(full);
      });
    walk(MUI_SRC);
    // color="a.b", or color={...} holding a quoted or template string with a dotted theme path.
    const dropped =
      /\bcolor=(?:["'][a-z]+\.[a-zA-Z]+["']|\{(?:[^{}]|\{[^{}]*\})*["'`][^"'`]*\.(?:main|light|dark|primary|secondary|disabled)["'`])/g;
    const found = files.flatMap((file) =>
      [...fs.readFileSync(file, 'utf8').matchAll(dropped)].map((m) => `${path.relative(MUI_SRC, file)}: ${m[0]}`)
    );

    expect(found).toEqual([]);
  });
});
