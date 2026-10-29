import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { ListView } from '../../../../../../packs/shadcn/src/components/ListView';
import { Accordion } from '../../../../../../packs/shadcn/src/components/Accordion';
import { MultiSelect } from '../../../../../../packs/shadcn/src/components/MultiSelect';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// Codex review of the shadcn pack's ListView, Accordion and MultiSelect (RELATED-01, RELATED-02, 2026-10-27): rows
// with a repeated id, an accordion whose sections are replaced, and a selection action read back on the next line.
// The pack components, the inline SDK and the host renderer are the real ones; only the module and CSS loading is
// replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const COMPONENTS = { ListView, Accordion, MultiSelect };
let mounts = 0;

const mount = async (name, props) => {
  loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
  const exposed = {};
  const events = [];
  const actions = new Map();
  const cacheKey = `lists-accordion-${name}-${(mounts += 1)}`;
  const host = makeHost(name, {});
  const make = (p) => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={cacheKey}
      componentName={name}
      componentProps={p}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={actions}
      host={host}
      dataCy="pack-widget"
    />
  );
  const view = render(make(props));
  const root = () => view.container.querySelector('[data-cy="pack-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-cc-root').childElementCount).toBeGreaterThan(0));
  await waitFor(() => expect(actions.size).toBeGreaterThan(0));
  const update = (p) => view.rerender(make(p));
  return { root, exposed, events, actions, update };
};

describe('ListView rows with a repeated id (RELATED-01)', () => {
  const twins = () => [
    { id: 'same', name: 'Alpha' },
    { id: 'same', name: 'Beta' },
  ];
  const props = (data) => ({
    data,
    idField: 'id',
    titleField: 'name',
    subtitleField: '',
    badgeField: '',
    actionLabel: '',
    showAvatar: false,
  });
  let warn;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('highlights only the row picked, and follows it by occurrence through a refresh', async () => {
    const c = await mount('ListView', props(twins()));
    const rows = () => [...c.root().querySelectorAll('.u2l-list-item')];
    expect(rows()).toHaveLength(2);
    fireEvent.click(rows()[1]);
    await waitFor(() => expect(c.exposed.selectedItem).toEqual({ id: 'same', name: 'Beta' }));
    expect(rows().map((r) => r.classList.contains('is-selected'))).toEqual([false, true]);
    expect(c.exposed.selectedRecordId).toBe(1);
    expect(c.exposed.selectedItemId).toBe('same');

    // A query refresh: equal rows, new objects.
    act(() => c.update(props(twins())));
    await act(async () => {});
    expect(c.exposed.selectedItem).toEqual({ id: 'same', name: 'Beta' });
    expect(c.exposed.selectedRecordId).toBe(1);
    expect(rows().map((r) => r.classList.contains('is-selected'))).toEqual([false, true]);
  });

  it('warns once that ids should be unique', async () => {
    const c = await mount('ListView', props(twins()));
    act(() => c.update(props(twins())));
    await act(async () => {});
    const ours = warn.mock.calls.filter(
      ([m]) => typeof m === 'string' && m.includes('ListView') && m.includes('unique')
    );
    expect(ours).toHaveLength(1);
    expect(ours[0][0]).toContain('"same"');
  });

  it('does not warn when every id is its own', async () => {
    await mount(
      'ListView',
      props([
        { id: 1, name: 'Alpha' },
        { id: 2, name: 'Beta' },
      ])
    );
    const ours = warn.mock.calls.filter(([m]) => typeof m === 'string' && m.includes('ListView'));
    expect(ours).toHaveLength(0);
  });

  it('keeps rows without an id apart from a row whose id reads like a fallback key', async () => {
    const c = await mount('ListView', props([{ name: 'No id' }, { id: '#0', name: 'Hash id' }]));
    const rows = () => [...c.root().querySelectorAll('.u2l-list-item')];
    fireEvent.click(rows()[0]);
    await waitFor(() => expect(c.exposed.selectedItem).toEqual({ name: 'No id' }));
    expect(rows().map((r) => r.classList.contains('is-selected'))).toEqual([true, false]);
  });

  it('keeps a paged selection on its own row when a repeated id spans pages', async () => {
    const data = [
      { id: 'x', name: 'One' },
      { id: 'y', name: 'Two' },
      { id: 'x', name: 'Three' },
    ];
    const paged = { ...props(data), enablePagination: true, rowsPerPage: 2 };
    const c = await mount('ListView', paged);
    act(() => c.actions.get('setPage')(2));
    await waitFor(() => expect(c.root().querySelectorAll('.u2l-list-item')).toHaveLength(1));
    fireEvent.click(c.root().querySelector('.u2l-list-item'));
    await waitFor(() => expect(c.exposed.selectedItem).toEqual({ id: 'x', name: 'Three' }));
    expect(c.root().querySelector('.u2l-list-item').classList.contains('is-selected')).toBe(true);
    act(() => c.actions.get('setPage')(1));
    await waitFor(() => expect(c.root().querySelectorAll('.u2l-list-item')).toHaveLength(2));
    expect([...c.root().querySelectorAll('.u2l-list-item')].some((r) => r.classList.contains('is-selected'))).toBe(
      false
    );
  });
});

describe('Accordion sections replaced at the open index (RELATED-02)', () => {
  it('publishes the new section value when the items change under the same open index', async () => {
    const old = [{ value: 'old', title: 'Old title', content: 'Old body' }];
    const c = await mount('Accordion', { items: old, defaultOpen: [0] });
    await waitFor(() => expect(c.exposed.value).toBe('old'));
    expect(c.exposed.openIndexes).toEqual([0]);

    act(() => c.update({ items: [{ value: 'new', title: 'New title', content: 'New body' }], defaultOpen: [0] }));
    await waitFor(() => expect(c.exposed.value).toBe('new'));
    expect(c.exposed.openIndexes).toEqual([0]);
    expect(c.exposed.isExpanded).toBe(true);
    expect(c.root().textContent).toContain('New title');
    // Republishing is not a user change.
    expect(c.events).not.toContain('onChange');
  });

  it('keeps the value when the items change but the open section does not', async () => {
    const items = [
      { value: 'a', title: 'A', content: '' },
      { value: 'b', title: 'B', content: '' },
    ];
    const c = await mount('Accordion', { items, defaultOpen: [0] });
    await waitFor(() => expect(c.exposed.value).toBe('a'));
    act(() => c.update({ items: [items[0], { value: 'c', title: 'C', content: '' }], defaultOpen: [0] }));
    await act(async () => {});
    expect(c.exposed.value).toBe('a');
    expect(c.exposed.openIndexes).toEqual([0]);
  });
});

describe('MultiSelect actions read back on the next line', () => {
  const options = [
    { label: 'Design', value: 'design' },
    { label: 'Sales', value: 'sales' },
    { label: 'Support', value: 'support' },
  ];
  const props = { options, defaultValue: ['design'] };
  const callThenRead = (c, action, ...args) => {
    let read;
    act(() => {
      c.actions.get(action)(...args);
      read = { values: c.exposed.values, selected: (c.exposed.selectedOptions || []).map((o) => o.value) };
    });
    return read;
  };

  it('selectOptions is exposed at once', async () => {
    const c = await mount('MultiSelect', props);
    await waitFor(() => expect(c.exposed.values).toEqual(['design']));
    expect(callThenRead(c, 'selectOptions', ['sales'])).toEqual({
      values: ['design', 'sales'],
      selected: ['design', 'sales'],
    });
  });

  it('deselectOptions, setValues and clear are exposed at once', async () => {
    const c = await mount('MultiSelect', props);
    await waitFor(() => expect(c.exposed.values).toEqual(['design']));
    expect(callThenRead(c, 'setValues', ['sales', 'support'])).toEqual({
      values: ['sales', 'support'],
      selected: ['sales', 'support'],
    });
    expect(callThenRead(c, 'deselectOptions', ['sales'])).toEqual({ values: ['support'], selected: ['support'] });
    expect(callThenRead(c, 'clear')).toEqual({ values: [], selected: [] });
  });

  it('actions run one after another in one frame build on each other', async () => {
    const c = await mount('MultiSelect', props);
    await waitFor(() => expect(c.exposed.values).toEqual(['design']));
    let read;
    act(() => {
      c.actions.get('selectOptions')(['sales']);
      c.actions.get('selectOptions')(['support']);
      c.actions.get('deselectOptions')(['design']);
      read = c.exposed.values;
    });
    expect(read).toEqual(['sales', 'support']);
    await act(async () => {});
    expect(c.exposed.values).toEqual(['sales', 'support']);
    expect([...c.root().querySelectorAll('.uc-chip')].map((n) => n.textContent)).toEqual(['Sales', 'Support']);
    // Actions are not user picks.
    expect(c.events).not.toContain('onSelect');
  });
});
