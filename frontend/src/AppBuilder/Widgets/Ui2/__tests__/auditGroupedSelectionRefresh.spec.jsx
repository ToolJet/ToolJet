// Release audit round 2 (Codex fixture, kept as written): ButtonGroup reset its choice whenever its buttons changed
// (a reorder replayed the default, and a native Form submitted it), and ToggleGroup brought back a removed choice when
// its option returned. Removal now takes the choice with it; a choice survives a refresh; a new default still applies.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, countInvocationsOn, setVariableOn } from '@/AppBuilder/Widgets/widgetHarness';
const json = (x) => '{{' + JSON.stringify(x) + '}}';
const opts = [
  { label: 'Alpha', value: 'a' },
  { label: 'Beta', value: 'b' },
];
describe.each(['ShadToggleGroup', 'ShadButtonGroup'])('%s selection refresh', (type) => {
  const w = createWidgetHarness({ componentType: type, id: 'group1', handle: 'group1', widgetWidth: 500 });
  const prop = type === 'ShadToggleGroup' ? 'options' : 'buttons';
  const role = type === 'ShadToggleGroup' ? 'radio' : 'button';
  beforeEach(() => w.setup());
  afterEach(w.teardown);
  const refresh = (x) => w.setComponentProperty('group1', prop, json(x), 'properties');
  async function mount() {
    w.render({
      currentMode: 'view',
      properties: { [prop]: binding(json(opts)), defaultValue: binding('a'), mode: binding('single') },
    });
    await waitFor(() => expect(w.exposed().value).toBe('a'));
    w.setEvents(countInvocationsOn('group1', 'onChange'));
    await act(async () => fireEvent.click(screen.getByRole(role, { name: 'Beta', exact: true })));
    expect(w.exposed().value).toBe('b');
    expect(w.variables().calls).toBe(1);
  }
  test('same values with refreshed labels preserve choice silently', async () => {
    await mount();
    refresh([
      { label: 'Alpha new', value: 'a' },
      { label: 'Beta new', value: 'b' },
    ]);
    expect(w.exposed().value).toBe('b');
    expect(w.variables().calls).toBe(1);
  });
  test('reorder preserves selected identity rather than replaying default', async () => {
    await mount();
    refresh([...opts].reverse());
    expect(w.exposed().value).toBe('b');
    expect(w.variables().calls).toBe(1);
  });
  test('adding an unrelated choice preserves user selection', async () => {
    await mount();
    refresh([...opts, { label: 'Gamma', value: 'c' }]);
    expect(w.exposed().value).toBe('b');
    expect(w.variables().calls).toBe(1);
  });
  test('removing unrelated default choice preserves selected identity', async () => {
    await mount();
    refresh([opts[1]]);
    expect(w.exposed().value).toBe('b');
    expect(w.variables().calls).toBe(1);
  });
  test('removed selected choice clears instead of choosing an unrequested default', async () => {
    await mount();
    refresh([opts[0]]);
    expect(w.exposed().value).toBe('');
    expect(w.variables().calls).toBe(1);
  });
  test('empty options then restored options must not silently reselect', async () => {
    await mount();
    refresh([]);
    expect(w.exposed().value).toBe('');
    refresh(opts);
    expect({ value: w.exposed().value, calls: w.variables().calls }).toEqual({ value: '', calls: 1 });
  });
  test('remove selected value then restore does not resurrect it', async () => {
    await mount();
    refresh([opts[0]]);
    refresh(opts);
    expect({ value: w.exposed().value, calls: w.variables().calls }).toEqual({ value: '', calls: 1 });
  });
  test('explicit clear followed by same values/labels refresh stays clear', async () => {
    await mount();
    await w.act('clear');
    refresh([
      { ...opts[0], label: 'Alpha new' },
      { ...opts[1], label: 'Beta new' },
    ]);
    expect(w.exposed().value).toBe('');
    expect(w.variables().calls).toBe(1);
  });
  test('genuine default replacement still selects the authored value silently', async () => {
    await mount();
    w.setComponentProperty('group1', 'defaultValue', 'b', 'properties');
    w.setComponentProperty('group1', 'defaultValue', 'a', 'properties');
    expect(w.exposed().value).toBe('a');
    expect(w.variables().calls).toBe(1);
  });
});

describe('ButtonGroup refresh through native Form', () => {
  const w = createWidgetHarness({
    componentType: 'ShadButtonGroup',
    id: 'group1',
    handle: 'group1',
    preload: ['Form'],
  });
  beforeEach(() => w.setup());
  afterEach(w.teardown);
  test('reordering buttons must not change the submitted user choice', async () => {
    w.renderInsideForm({
      properties: { buttons: binding(json(opts)), defaultValue: binding('a'), mode: binding('single') },
    });
    w.setComponentProperty('form1', 'resetOnSubmit', '{{false}}', 'properties');
    w.setEvents(setVariableOn('form1', 'onSubmit', { key: 'submitted', value: '{{components.form1.formData}}' }));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Beta', exact: true })));
    expect(w.exposed().value).toBe('b');
    w.setComponentProperty('group1', 'buttons', json([...opts].reverse()), 'properties');
    await act(async () => {
      await w.exposed('form1').submitForm();
    });
    expect(w.variables().submitted).toEqual({ group1: 'b' });
  });
});
