import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, waitFor, act } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { TagsInput } from '../../../../../../packs/shadcn/src/components/TagsInput';
import { Link } from '../../../../../../packs/shadcn/src/components/Link';

// QA RK-07 (invalid border), RK-08 (Tags Input opens on click) and RK-12 (scheme-less Link target).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

beforeAll(() => {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

const COMPONENTS = { TagsInput, Link };
const mount = async (name, props) => {
  loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
  const host = {
    formField: true,
    fieldId: `rk-${name}`,
    disabled: false,
    loading: false,
    useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
  };
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`shad-rk-${name}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={host}
      dataCy="pack-rk"
    />
  );
  const root = () => view.container.querySelector('[data-cy="pack-rk"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.ui')).toBeTruthy());
  return { root };
};

describe('RK-07: an invalid field draws the error border', () => {
  const css = fs.readFileSync(path.join(__dirname, '../../../../../../packs/shadcn/src/styles/ui2-inputs.css'), 'utf8');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));

  it('re-resolves --ui2-edge on the invalid field, where --lk-invalid is set', () => {
    // jsdom has no cascade: --ui2-edge on .ui2-in resolves before --lk-invalid is set on the field, so the invalid
    // rule must declare it again. Needs a browser check for the painted colour.
    const decl = rules.find((r) => /\.ui-field--invalid\s*$/.test(r.sel) && /--ui2-edge\s*:/.test(r.body));
    expect(decl?.body).toMatch(/--ui2-edge:\s*var\(--lk-invalid/);
  });
});

// The list portals into the shared popup layer, a second shadow host in the body.
const list = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot?.querySelector('[role="listbox"]') ?? null;

describe('RK-08: a mouse click into Tags Input keeps the suggestions open', () => {
  it('keeps the list open when the focusin that opened it reaches the document retargeted to the host', async () => {
    const { root } = await mount('TagsInput', { suggestions: ['alpha', 'beta'], defaultValue: [] });
    const input = root().querySelector('input.ui2-tags-input');
    const list = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot?.querySelector('.ui2-tags-menu');
    await act(async () => input.focus());
    await waitFor(() => expect(list()).toBeTruthy());
    // A browser's focusin is composed: at the document Radix sees the shadow host as its target, not the input.
    await act(async () => {
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(list()).toBeTruthy();
  });
});

describe('RK-12: Link target without a scheme', () => {
  const href = async (target) => {
    const { root } = await mount('Link', { linkTarget: target, linkText: 'Go' });
    return root().querySelector('a')?.getAttribute('href') ?? null;
  };
  it('renders an anchor to https://tooljet.com for "tooljet.com"', async () => {
    expect(await href('tooljet.com')).toBe('https://tooljet.com');
  });
  it('keeps a path and adds https:// to "www.tooljet.com/docs?a=1"', async () => {
    expect(await href('www.tooljet.com/docs?a=1')).toBe('https://www.tooljet.com/docs?a=1');
  });
  it('still refuses javascript: and other script-like targets', async () => {
    expect(await href('javascript:alert(1)')).toBe(null);
    expect(await href('JaVaScRiPt:alert(1)')).toBe(null);
    expect(await href('data:text/html,x')).toBe(null);
  });
  it('leaves absolute, path and mailto targets alone', async () => {
    expect(await href('https://a.io/x')).toBe('https://a.io/x');
    expect(await href('/p')).toBe('/p');
    expect(await href('mailto:a@b.co')).toBe('mailto:a@b.co');
  });
});
