/**
 * UI 2.0 pickers and the Tags input: what is selected stays tied to the options and tags that exist.
 *
 * Release audit round 2 (17 Oct):
 *  - Select, Combobox and Multiselect kept a chosen option's key after the option was removed, so it came back
 *    selected when the option reappeared (a removed choice restored itself).
 *  - The Multiselect counted a removed (invisible) choice against maxSelections, so its actions refused a new pick.
 *  - Tags input identity: chips were keyed by their position, so removing a tag remounted every chip after it; and with
 *    caseSensitive on, typed text took a suggestion of other case (React became react).
 * A default whose options arrive later (a query still loading) is kept: only an option that existed and then went
 * takes its selection with it (the control).
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'w1';
const opts = (...values) => `{{${JSON.stringify(values.map((v) => ({ label: v.toUpperCase(), value: v })))}}}`;
const TYPES = ['ShadSelect', 'ShadCombobox', 'ShadMultiselect'];
const harnesses = Object.fromEntries(
  [...TYPES, 'ShadTagsInput'].map((type) => [
    type,
    createWidgetHarness({ componentType: type, id: ID, handle: 'w1', widgetHeight: 160, preload: [type] }),
  ])
);
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 20)));

describe.each(TYPES)('[UI2-SELECT-301] %s and removed options', (type) => {
  const multi = type === 'ShadMultiselect';
  const widget = harnesses[type];
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);
  const value = () => (multi ? widget.exposed().values : widget.exposed().value);
  const setOptions = (o) => widget.setComponentProperty(ID, 'options', o, 'properties');

  it('a removed choice does not come back when its option does', async () => {
    widget.render({
      currentMode: 'view',
      properties: { options: binding(opts('a', 'b')), defaultValue: binding(multi ? '{{[]}}' : '') },
    });
    await waitFor(() => expect(widget.exposed()?.options).toHaveLength(2));
    await widget.act(multi ? 'selectOptions' : 'selectOption', multi ? ['b'] : 'b');
    await waitFor(() => expect(value()).toEqual(multi ? ['b'] : 'b'));
    setOptions(opts('a'));
    await waitFor(() => expect(value()).toEqual(multi ? [] : ''));
    setOptions(opts('a', 'b'));
    await waitFor(() => expect(widget.exposed().options).toHaveLength(2));
    await settle();
    expect(value()).toEqual(multi ? [] : '');
  });

  it('a default whose options arrive later is kept (control)', async () => {
    widget.render({
      currentMode: 'view',
      properties: { options: binding('{{[]}}'), defaultValue: binding(multi ? "{{['b']}}" : 'b') },
    });
    await waitFor(() => expect(widget.exposed()?.options).toEqual([]));
    setOptions(opts('a', 'b'));
    await waitFor(() => expect(value()).toEqual(multi ? ['b'] : 'b'));
  });

  if (multi)
    it('a removed choice does not count against maxSelections', async () => {
      widget.render({
        currentMode: 'view',
        properties: {
          options: binding(opts('a', 'b', 'c')),
          defaultValue: binding('{{[]}}'),
          maxSelections: binding('{{2}}'),
        },
      });
      await waitFor(() => expect(widget.exposed()?.options).toHaveLength(3));
      await widget.act('selectOptions', ['a', 'b']);
      setOptions(opts('a', 'c'));
      await waitFor(() => expect(value()).toEqual(['a']));
      await widget.act('selectOptions', ['c']);
      await waitFor(() => expect(value()).toEqual(['a', 'c']));
    });
});

describe('[UI2-TAGS-302] Tags input identity', () => {
  const widget = harnesses.ShadTagsInput;
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);
  const box = () => document.querySelector('input:not([type=hidden])');

  it('removing a tag keeps the chips after it (no remount)', async () => {
    widget.render({ currentMode: 'view', properties: { defaultValue: binding("{{['alpha', 'beta', 'gamma']}}") } });
    const beta =
      (await screen.findByRole('button', { name: 'Remove beta' })).closest('[data-tag]') ??
      screen.getByRole('button', { name: 'Remove beta' }).parentElement;
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Remove alpha' })));
    await waitFor(() => expect(widget.exposed().values).toEqual(['beta', 'gamma']));
    const after =
      screen.getByRole('button', { name: 'Remove beta' }).closest('[data-tag]') ??
      screen.getByRole('button', { name: 'Remove beta' }).parentElement;
    expect(after).toBe(beta);
  });

  it('with caseSensitive on, typed text keeps its case even when a suggestion differs only by case', async () => {
    widget.render({
      currentMode: 'view',
      properties: {
        defaultValue: binding('{{[]}}'),
        caseSensitive: binding('{{true}}'),
        suggestions: binding("{{['react']}}"),
      },
    });
    await waitFor(() => expect(box()).not.toBeNull());
    await act(async () => fireEvent.change(box(), { target: { value: 'React' } }));
    await act(async () => fireEvent.keyDown(box(), { key: 'Escape' }));
    await act(async () => fireEvent.keyDown(box(), { key: 'Enter' }));
    await waitFor(() => expect(widget.exposed().values).toEqual(['React']));
  });
});
