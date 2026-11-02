import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { resolveDynamicValues } from '@/AppBuilder/_stores/utils';
import { writeLiteralCode } from '@/AppBuilder/RightSideBar/Inspector/Components/LibraryComponent/literal';
import { OptionsEditor } from '@/AppBuilder/RightSideBar/Inspector/Components/LibraryComponent/OptionsEditor';
import { DropdownMenu } from '../../../../../../packs/shadcn/src/components/DropdownMenu';
import { installBrowserStubs } from './fuzz/packTestEnv';

// The shadcn pack's DropdownMenu after the team's testing (2026-10-27): the default items no longer suggest keyboard
// shortcuts (the shortcut field is display text only), selectedItem keeps the picked value's type as
// lastClickedOption.value does, and an item value computed with {{ }} works when Items is written as code. The pack
// component, the inline SDK and the host renderer are the real ones; only the module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

beforeAll(() => {
  installBrowserStubs();
  // Radix's popper calls these, which jsdom lacks.
  if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
  if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
  if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  document.body.innerHTML = '';
});

let mounts = 0;

// Mounts the DropdownMenu; `exposed` holds its exposed values, `events` the events it fired.
const mount = async (props) => {
  loadLibraryModule.mockResolvedValue({ DropdownMenu });
  const exposed = {};
  const events = [];
  const actions = new Map();
  const host = {
    fieldId: `dd-team-${(mounts += 1)}`,
    disabled: false,
    loading: false,
    useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
  };
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`shad-dd-team-${mounts}`}
      componentName="DropdownMenu"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={actions}
      host={host}
      dataCy="pack-dd-team"
    />
  );
  const root = () => view.container.querySelector('[data-cy="pack-dd-team"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.ui')).toBeTruthy());
  const open = async () => {
    await waitFor(() => expect(actions.has('open')).toBe(true));
    act(() => actions.get('open')());
    await waitFor(() => expect(popupRoot()?.querySelector('[role="menu"]')).toBeTruthy());
  };
  return { exposed, events, open };
};

// The popup layer the pack portals into: a shadow root of its own on the page.
const popupRoot = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;
const items = () => Array.from(popupRoot().querySelectorAll('[role="menuitem"]'));
const pickItem = (label) => {
  const item = items().find((el) => el.textContent.includes(label));
  act(() => {
    fireEvent.click(item);
  });
};

describe('Bug 1: the default items suggest no keyboard shortcuts', () => {
  it('the dropped menu draws its default items without a shortcut', async () => {
    const { open } = await mount({});
    await open();
    expect(items().map((el) => el.textContent)).toEqual(['Edit', 'Duplicate', 'Archive', 'Delete']);
    expect(popupRoot().querySelector('.n2-menu-shortcut')).toBeNull();
    expect(popupRoot().textContent).not.toMatch(/⌘/);
  });

  it('a shortcut an author sets is drawn as text only: pressing the keys picks nothing', async () => {
    const { open, events, exposed } = await mount({
      items: [
        { label: 'Edit', value: 'edit', shortcut: '⌘E' },
        { label: 'Copy', value: 'copy' },
      ],
    });
    await open();
    expect(popupRoot().querySelector('.n2-menu-shortcut').textContent).toBe('⌘E');
    const menu = popupRoot().querySelector('[role="menu"]');
    fireEvent.keyDown(menu, { key: 'e', metaKey: true, composed: true });
    fireEvent.keyDown(document, { key: 'e', metaKey: true });
    expect(events).not.toContain('onSelect');
    expect(exposed.selectedItem).toBe('');
  });
});

describe('Bug 2: selectedItem keeps the picked value type', () => {
  it.each([
    ['a number', 1],
    ['zero', 0],
    ['true', true],
    ['false', false],
    ['text', 'edit'],
  ])('%s stays as it is, the same as lastClickedOption.value', async (_, value) => {
    const { open, exposed, events } = await mount({ items: [{ label: 'Pick me', value }] });
    await open();
    pickItem('Pick me');
    await waitFor(() => expect(events).toContain('onSelect'));
    expect(exposed.selectedItem).toBe(value);
    expect(exposed.lastClickedOption.value).toBe(value);
    expect(exposed.selectedItem === exposed.lastClickedOption.value).toBe(true);
  });

  it('a plain-string item keeps its text', async () => {
    const { open, exposed } = await mount({ items: ['Alpha', 'Beta'] });
    await open();
    pickItem('Beta');
    await waitFor(() => expect(exposed.selectedItem).toBe('Beta'));
  });
});

describe('Bug 3: an item value computed with {{ }}', () => {
  const state = { components: { picker: { value: 7 } } };

  // Root cause, pinned: the options editor's per-item Value box is a literal text field, so {{ }} typed there is saved
  // as a string inside the list's code, and the host's resolver strips the inner braces. The pack is handed "1}}".
  it('typed into the options editor Value box, it reaches the pack as broken text (host inspector, not the pack)', async () => {
    const written = [];
    const view = render(
      <OptionsEditor
        value={[{ label: 'One', value: 'one' }]}
        onChange={(next) => written.push(next)}
        darkMode={false}
        cyLabel="items"
      />
    );
    fireEvent.click(view.container.querySelector('[data-cy="items-row-0"]'));
    const box = await waitFor(() => {
      const el = document.querySelector('[data-cy="items-option-value"]');
      expect(el).toBeTruthy();
      return el;
    });
    fireEvent.change(box, { target: { value: '{{1}}' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    // The editor saves the typed binding as a plain string inside the list.
    expect(written[written.length - 1]).toEqual([{ label: 'One', value: '{{1}}' }]);
    const stored = writeLiteralCode(written[written.length - 1]);
    expect(resolveDynamicValues(stored, state)).toEqual([{ label: 'One', value: '1}}' }]);
  });

  it('written as code on Items (fx), the value resolves with its type and selectedItem keeps it', async () => {
    const resolved = resolveDynamicValues(
      "{{[{ label: 'Seven', value: components.picker.value }, { label: 'Flag', value: 1 > 0 }]}}",
      state
    );
    expect(resolved).toEqual([
      { label: 'Seven', value: 7 },
      { label: 'Flag', value: true },
    ]);
    const { open, exposed } = await mount({ items: resolved });
    await open();
    pickItem('Seven');
    await waitFor(() => expect(exposed.selectedItem).toBe(7));
    expect(exposed.lastClickedOption).toEqual({ label: 'Seven', description: '', value: 7 });
  });
});
