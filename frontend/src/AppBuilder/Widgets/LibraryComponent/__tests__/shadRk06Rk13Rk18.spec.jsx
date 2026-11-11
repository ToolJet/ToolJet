import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { FileUpload } from '../../../../../../packs/shadcn/src/components/FileUpload';
import { Navigation } from '../../../../../../packs/shadcn/src/components/Navigation';
import { Text } from '../../../../../../packs/shadcn/src/components/Text';

// Layout contract of three Rocket 2.0 components in a fixed-height box (the host root clips with overflow: clip).
// jsdom has no layout: the pack CSS is read from source and the declarations that match the rendered element are
// checked. Real clipping, scrolling and hit-testing need a browser.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const STYLES = path.resolve(__dirname, '../../../../../../packs/shadcn/src/styles');
const CSS = ['ui.css', 'display.css', 'ui2-inputs.css', 'ui2-display.css', 'ui2-nav.css']
  .map((f) => fs.readFileSync(path.join(STYLES, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''))
  .join('\n');

// Declarations of every rule whose selector matches el (source order, last wins; specificity is not modelled).
const declared = (el) => {
  const out = {};
  for (const [, sel, body] of CSS.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    const hit = sel.split(',').some((s) => {
      try {
        return el.matches(s.trim());
      } catch (e) {
        return false;
      }
    });
    if (!hit) continue;
    for (const d of body.split(';')) {
      const i = d.indexOf(':');
      if (i > 0) out[d.slice(0, i).trim()] = d.slice(i + 1).trim();
    }
  }
  return out;
};

const mount = async (name, Comp, componentProps) => {
  loadLibraryModule.mockResolvedValue({ [name]: Comp });
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`rk-${name}`}
      componentName={name}
      componentProps={componentProps}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={{
        disabled: false,
        loading: false,
        useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
      }}
      dataCy="rk"
    />
  );
  const root = () => view.container.querySelector('[data-cy="rk"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.ui')).toBeTruthy());
  return root;
};

describe('RK-06 File Upload file list in a fixed-height box', () => {
  it('keeps every row reachable: the field is capped to the box and scrolls', async () => {
    const root = await mount('FileUpload', FileUpload, { multiple: true, maxFiles: 5 });
    // The field must not outgrow the box, or the clipped host hides the rows and their remove buttons.
    const field = root().querySelector('.ui-field');
    expect(declared(field)['max-height']).toBe('100%');
    expect(declared(field)['overflow-y']).toBe('auto');
    // With no files the drop zone fits the box, so its dashed border is never cut in the default size.
    expect(root().querySelector('.ui2-fu').className).toContain('is-empty');
    const drop = root().querySelector('.ui2-drop');
    expect(declared(drop)['min-height']).toBe('0');
    // The list must not collapse to 0px.
    const ul = document.createElement('ul');
    ul.className = 'ui2-files';
    field.appendChild(ul);
    expect(declared(ul)['flex-shrink']).toBe('0');
  });
});

describe('RK-13 Navigation horizontal, items wider than the widget', () => {
  it.each(['center', 'end'])('Align %s uses safe alignment so the first item can be scrolled to', async (align) => {
    const root = await mount('Navigation', Navigation, { orientation: 'horizontal', align });
    const nav = root().querySelector('.n2-nav');
    expect(nav.className).toContain(`is-align-${align}`);
    expect(declared(nav)['justify-content']).toMatch(/^safe /);
    expect(declared(nav)['overflow-x']).toBe('auto');
  });
});

describe('RK-18 Text in a box shorter than its text', () => {
  it('scrolls in its box and never centres the overflow off the top', async () => {
    const root = await mount('Text', Text, { text: 'long '.repeat(40) });
    const wrap = root().querySelector('.ui-text-wrap');
    expect(wrap.querySelector('p.ui2-text')).toBeTruthy();
    const d = declared(wrap);
    expect(d['overflow-y']).toBe('auto');
    expect(d['align-items']).toBe('safe center');
  });
});
