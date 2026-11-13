import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { Calendar } from '../../../../../../packs/shadcn/src/components/Calendar';
import { FileUpload } from '../../../../../../packs/shadcn/src/components/FileUpload';
import { Rating } from '../../../../../../packs/shadcn/src/components/Rating';
import { Progress } from '../../../../../../packs/shadcn/src/components/Progress';
import { Stepper } from '../../../../../../packs/shadcn/src/components/Stepper';
import { Tags } from '../../../../../../packs/shadcn/src/components/Tags';
import { installBrowserStubs } from './fuzz/packTestEnv';

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

beforeAll(() => {
  installBrowserStubs();
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  document.body.innerHTML = '';
});

const COMPONENTS = { Calendar, FileUpload, Rating, Progress, Stepper, Tags };

const mount = async (name, props, { loading = false } = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
  const exposed = {};
  const actions = new Map();
  const host = {
    formField: true,
    fieldId: `p4-${name}`,
    disabled: false,
    loading,
    useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
  };
  const make = (componentProps) => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`shad-p4-${name}`}
      componentName={name}
      componentProps={componentProps}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(k, v) => {
        exposed[k] = v;
      }}
      fireEvent={() => {}}
      actions={actions}
      host={host}
      dataCy="pack-p4"
    />
  );
  const view = render(make(props));
  const root = () => view.container.querySelector('[data-cy="pack-p4"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.ui')).toBeTruthy());
  const run = (action, ...args) => act(() => actions.get(action)(...args));
  return { exposed, root, actions, run, rerender: (next) => view.rerender(make(next)) };
};

describe('RK-19: Calendar selectDate with text that is not a date', () => {
  it('keeps the selected day', async () => {
    // Break this catches: an unparseable selectDate argument clears a single selection.
    const cal = await mount('Calendar', { mode: 'single' });
    await waitFor(() => expect(cal.actions.has('selectDate')).toBe(true));
    await cal.run('selectDate', '2025-08-09');
    await waitFor(() => expect(cal.exposed.value).toBe('2025-08-09'));
    await cal.run('selectDate', 'garbage');
    await act(() => new Promise((r) => setTimeout(r, 30)));
    expect(cal.exposed.value).toBe('2025-08-09');
  });
});

describe('RK-21: File Upload hint with Max files 1', () => {
  it('reads "max 1 file"', async () => {
    // Break this catches: the hint pluralises a count of one ("max 1 files").
    const fu = await mount('FileUpload', { multiple: true, maxFiles: 1, hint: '' });
    const text = fu.root().textContent;
    expect(text).toContain('max 1 file');
    expect(text).not.toContain('max 1 files');
  });
});

describe('RK-26: Rating Default value and Number of icons change together', () => {
  it('takes the new default, fitted to the new maximum', async () => {
    // Break this catches: refitting the old rating to the new maximum runs after the new default and wins.
    const r = await mount('Rating', { defaultValue: 4, max: 5 });
    await waitFor(() => expect(r.exposed.value).toBe(4));
    r.rerender({ defaultValue: 2, max: 3 });
    await waitFor(() => expect(r.exposed.value).toBe(2));
    await act(() => new Promise((res) => setTimeout(res, 30)));
    expect(r.exposed.value).toBe(2);
  });

  it('still fits the rating when only Number of icons shrinks', async () => {
    // Break this catches: skipping the refit also when the default did not change.
    const r = await mount('Rating', { defaultValue: 4, max: 5 });
    await waitFor(() => expect(r.exposed.value).toBe(4));
    r.rerender({ defaultValue: 4, max: 3 });
    await waitFor(() => expect(r.exposed.value).toBe(3));
  });
});

describe('RK-32: Progress setValue outside 0 to 100', () => {
  it.each([
    [150, 100],
    [-5, 0],
    [40, 40],
  ])('setValue(%p) exposes %p', async (input, expected) => {
    // Break this catches: the exposed value keeps a number the bar cannot show.
    const p = await mount('Progress', { value: 60 });
    await waitFor(() => expect(p.actions.has('setValue')).toBe(true));
    await p.run('setValue', input);
    await waitFor(() => expect(p.exposed.value).toBe(expected));
  });
});

describe('RK-31: Progress long label', () => {
  it('stays on one line, cut with an ellipsis, with the full text on hover', async () => {
    // Break this catches: the label wraps and pushes the bar out of a short box.
    const label = 'A very long progress label that keeps going until it cannot fit in a narrow box at all';
    const p = await mount('Progress', { value: 60, label, showValue: true });
    expect(p.root().querySelector('.ui2-progress-label').getAttribute('title')).toBe(label);
    const css = fs.readFileSync(
      path.resolve(__dirname, '../../../../../../packs/shadcn/src/styles/ui2-charts-progress.css'),
      'utf8'
    );
    const rule = css.match(/\.ui2-progress-label\s*\{([^}]*)\}/)[1];
    expect(rule).toMatch(/white-space:\s*nowrap/);
    expect(rule).toMatch(/text-overflow:\s*ellipsis/);
    expect(rule).toMatch(/overflow:\s*hidden/);
  });
});

describe('RK-39: Stepper with an empty Finish button label', () => {
  it('reads Finish on the last step', async () => {
    // Break this catches: an empty Finish label leaves the last step's main button blank.
    const s = await mount('Stepper', { finishLabel: '', currentStep: 'review' });
    const buttons = [...s.root().querySelectorAll('button')].map((b) => b.textContent.trim());
    expect(buttons).toContain('Finish');
  });
});

describe('RK-41: Tags loading with no tags', () => {
  it('shows the loading look, as it does with tags', async () => {
    // Break this catches: the empty-list branch returns before the loading frame, so only a dash shows.
    const t = await mount('Tags', { tags: [], loadingIndicator: 'spinner' }, { loading: true });
    await waitFor(() => expect(t.root().querySelector('.ui2-ld-box')).toBeTruthy());
  });
});
