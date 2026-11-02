import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// Rocket 2.0 (shadcn pack) Button with a long Label (pack_bug_fixes.md #1). The real Button, inline SDK and host
// renderer; only module and CSS loading is replaced. jsdom has no layout, so the oracle is what the shipped stylesheets
// compute for the rendered markup, not measured geometry.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const SOURCE = require('../../../../../../packs/shadcn/src/index.ts');
const STYLES = path.resolve(__dirname, '../../../../../../packs/shadcn/src/styles');
// Same order the pack ships them: the base button first, then UI 2.0's overrides.
const CSS = ['ui.css', 'ui2-nav.css'].map((file) => fs.readFileSync(path.join(STYLES, file), 'utf8')).join('\n');

const LONG_LABEL = 'An unusually long button label that does not fit in a narrow button box at all';

let style;
beforeAll(() => {
  style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
});
afterAll(() => style.remove());
afterEach(cleanup);

let serial = 0;
// Renders the Button, then copies its markup out of the shadow root so jsdom can compute the stylesheets against it.
async function mountButton(props = {}, hostState = {}) {
  loadLibraryModule.mockResolvedValue({ Button: SOURCE.Button });
  const view = render(
    <InlineLibraryComponent
      bundleUrl="shadcn-Button.js"
      cssUrl="shadcn-Button.css"
      cacheKey={`button-long-label-${++serial}`}
      componentName="Button"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      actions={new Map()}
      host={{ ...makeHost('Button', {}), ...hostState }}
      dataCy="long-label"
      fireEvent={() => {}}
    />
  );
  const shadow = () => view.container.querySelector('[data-cy="long-label"]')?.shadowRoot;
  await waitFor(() => expect(shadow()?.querySelector('button')).not.toBeNull());
  const holder = document.createElement('div');
  holder.innerHTML = shadow().querySelector('.ui').outerHTML;
  document.body.appendChild(holder);
  const button = holder.querySelector('button');
  return { button, spinner: button.querySelector('.n2-spinner'), cleanup: () => holder.remove() };
}

// The element that holds the label text, whatever it is called: the one that directly contains the text.
const labelElement = (button, label) =>
  [button, ...button.querySelectorAll('*')].find((el) =>
    [...el.childNodes].some((node) => node.nodeType === 3 && node.textContent === label)
  );

describe('Button long label', () => {
  test('a long label wraps inside the button instead of staying on one line', async () => {
    // Break this catches: the label keeps the button's white-space: nowrap and spills out of the button box.
    const { button, cleanup: done } = await mountButton({ text: LONG_LABEL });
    const label = labelElement(button, LONG_LABEL);

    expect(label).toBeDefined();
    expect(label).not.toBe(button);
    const css = getComputedStyle(label);
    expect(css.whiteSpace).toBe('normal');
    expect(css.overflowWrap).toBe('anywhere');
    done();
  });

  test('the label may shrink below its text width so it can wrap in a narrow button', async () => {
    // Break this catches: a flex item with min-width: auto refuses to shrink, so the row is wider than the box.
    const { button, cleanup: done } = await mountButton({ text: LONG_LABEL });

    expect(['0', '0px']).toContain(getComputedStyle(labelElement(button, LONG_LABEL)).minWidth);
    done();
  });

  test('while loading, the spinner stays outside the wrapping label, before it, and does not shrink', async () => {
    // Break this catches: the spinner is pushed out of view because it shares the overflowing text run.
    const { button, spinner, cleanup: done } = await mountButton({ text: LONG_LABEL }, { loading: true });
    const label = labelElement(button, LONG_LABEL);

    expect(spinner).not.toBeNull();
    expect(label.contains(spinner)).toBe(false);
    expect(spinner.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(getComputedStyle(spinner).flexShrink).toBe('0');
    done();
  });

  test('the button keeps its box height and clips a long label instead of growing past the box', async () => {
    // Break this catches: the button growing with its wrapped label, so it spills past its widget box and overlaps
    // the widgets around it.
    const { button, cleanup: done } = await mountButton({ text: LONG_LABEL });
    const css = getComputedStyle(button);
    const label = getComputedStyle(labelElement(button, LONG_LABEL));

    expect(css.height).toBe('100%');
    expect(css.minHeight).toBe('32px');
    expect(css.overflow).toBe('hidden');
    expect(label.maxHeight).toBe('100%');
    expect(label.overflow).toBe('hidden');
    done();
  });

  test('a short label is still the button text, unchanged', async () => {
    // Break this catches: the wrapper changes what a short label shows or reads as.
    const { button, cleanup: done } = await mountButton({ text: 'Save' });

    expect(button.textContent).toBe('Save');
    done();
  });
});
