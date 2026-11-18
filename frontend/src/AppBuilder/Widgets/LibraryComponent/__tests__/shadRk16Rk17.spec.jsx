import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { Select } from '../../../../../../packs/shadcn/src/components/Select';
import { RadioGroup } from '../../../../../../packs/shadcn/src/components/RadioGroup';
import { ToggleGroup } from '../../../../../../packs/shadcn/src/components/ToggleGroup';
import { installBrowserStubs } from './fuzz/packTestEnv';

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

beforeAll(() => {
  installBrowserStubs();
  if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
  if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
  if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  document.body.innerHTML = '';
});

const COMPONENTS = { Select, RadioGroup, ToggleGroup };

const mount = async (name, props) => {
  loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
  const exposed = {};
  const host = {
    formField: true,
    fieldId: `rk-${name}`,
    disabled: false,
    loading: false,
    useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
  };
  const make = (componentProps) => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`shad-rk-${name}`}
      componentName={name}
      componentProps={componentProps}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(k, v) => {
        exposed[k] = v;
      }}
      fireEvent={() => {}}
      actions={new Map()}
      host={host}
      dataCy="pack-rk"
    />
  );
  const view = render(make(props));
  const root = () => view.container.querySelector('[data-cy="pack-rk"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.ui')).toBeTruthy());
  return { exposed, root, rerender: (next) => view.rerender(make(next)) };
};

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));
const focusedIn = (el) => el.getRootNode().activeElement;
const popupRoot = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;

describe('RK-16: Options and Default value change together', () => {
  const n = { options: ['N1', 'N2'], defaultValue: 'N1' };
  const x = { options: ['X1', 'X2'], defaultValue: 'X2' };

  it.each(['Select', 'RadioGroup', 'ToggleGroup'])('%s picks the new default from the new options', async (name) => {
    const { exposed, rerender } = await mount(name, n);
    await waitFor(() => expect(exposed.value).toBe('N1'));
    rerender(x);
    await waitFor(() => expect(exposed.value).toBe('X2'));
  });
});

describe('RK-17: Select keyboard with an option valued empty', () => {
  it('ArrowDown from the first option goes to the second, not past it to All', async () => {
    const { root } = await mount('Select', {
      options: [
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 },
        { label: 'All', value: '' },
      ],
    });
    const trigger = root().querySelector('button');
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'Enter', composed: true });
    await waitFor(() => expect(popupRoot()?.querySelector('[role="listbox"]')).toBeTruthy());
    await settle();
    const items = () => Array.from(popupRoot().querySelectorAll('[role="option"]'));
    expect(focusedIn(items()[0])).toBe(items()[0]);
    fireEvent.keyDown(focusedIn(items()[0]), { key: 'ArrowDown', composed: true });
    await settle();
    expect(focusedIn(items()[0])).toBe(items()[1]);
  });
});
