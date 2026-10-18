// Release audit round 2 (Codex fixture, kept as written): a Number or Currency input with a minimum or maximum of
// numeric 0 took any value: the shared check reads a bound of 0 as no bound (core; native NumberInput shares it). The
// inputs' own numberBounds rule reads 0 as 0. String '0', tightened and loosened bounds are the controls.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/widgetHarness';
const cases = [
  ['ShadInput', 'abcde', 'maxLength', 3, 8, 'textbox'],
  ['ShadTextarea', 'abcde', 'maxLength', 3, 8, 'textbox'],
  ['ShadNumberInput', 42, 'maxValue', 30, 50, 'spinbutton'],
  ['ShadCurrencyInput', 42, 'maxValue', 30, 50, 'textbox'],
];
describe.each(cases)('%s dynamic validation', (type, value, rule, strict, loose, role) => {
  const w = createWidgetHarness({
    componentType: type,
    id: 'field1',
    handle: 'field1',
    preload: ['Form'],
    widgetHeight: 120,
    widgetWidth: 350,
  });
  beforeEach(() => w.setup());
  afterEach(w.teardown);
  const action = type === 'ShadCurrencyInput' ? 'setValue' : 'setText';
  const prop = { label: binding('Field'), defaultValue: binding('{{' + JSON.stringify(value) + '}}') };
  function setRule(key, value) {
    w.setComponentProperty('field1', key, value, 'validation');
  }
  async function mount(form = false) {
    if (form) w.renderInsideForm({ properties: prop });
    else w.render({ currentMode: 'view', properties: prop });
    await waitFor(() => expect(w.exposed()[action]).toBeInstanceOf(Function));
    await w.act(action, value);
    w.setEvents(countInvocationsOn('field1', 'onChange'));
  }
  function control() {
    return screen.getByRole(role, { name: 'Field' });
  }
  test('required toggles update exposed validity without value-change events', async () => {
    await mount();
    await w.act('clear');
    w.setEvents(countInvocationsOn('field1', 'onChange', { key: 'ruleChanges' }));
    setRule('mandatory', '{{true}}');
    await waitFor(() => expect(w.exposed().isValid).toBe(false));
    expect(w.exposed().isMandatory).toBe(true);
    setRule('mandatory', '{{false}}');
    await waitFor(() => expect(w.exposed().isValid).toBe(true));
    expect(w.exposed().isMandatory).toBe(false);
    expect(w.variables().ruleChanges).toBeUndefined();
  });
  test('tighten and loosen constraints revalidate untouched value and visible error', async () => {
    await mount();
    const before = w.exposed().value;
    setRule(rule, '{{' + strict + '}}');
    await waitFor(() => expect(w.exposed().isValid).toBe(false));
    expect(control()).toHaveAttribute('aria-invalid', 'true');
    expect(w.exposed().value).toEqual(before);
    setRule(rule, '{{' + loose + '}}');
    await waitFor(() => expect(w.exposed().isValid).toBe(true));
    expect(control()).not.toHaveAttribute('aria-invalid', 'true');
    expect(w.exposed().value).toEqual(before);
    expect(w.variables().calls).toBeUndefined();
  });
  test('Form rejects tightened constraint and accepts identical value after relaxation', async () => {
    await mount(true);
    const before = w.exposed().value;
    w.setComponentProperty('form1', 'validateOnSubmit', '{{true}}', 'properties');
    w.setComponentProperty('form1', 'resetOnSubmit', '{{false}}', 'properties');
    w.setEvents([
      ...setVariableOn('form1', 'onSubmit', { key: 'captured', value: '{{components.form1.formData}}' }),
      ...countInvocationsOn('form1', 'onInvalid', { key: 'invalid' }),
    ]);
    setRule(rule, '{{' + strict + '}}');
    await act(async () => {
      await w.exposed('form1').submitForm();
    });
    expect(w.variables().captured).toBeUndefined();
    expect(w.variables().invalid).toBe(1);
    setRule(rule, '{{' + loose + '}}');
    await act(async () => {
      await w.exposed('form1').submitForm();
    });
    expect(w.variables().captured).toEqual({ field1: before });
    expect(w.variables().invalid).toBe(1);
  });
  if (type === 'ShadInput' || type === 'ShadTextarea')
    test('malformed regex shows error and removing it recovers without remount', async () => {
      await mount();
      const input = control();
      setRule('regex', '[');
      await waitFor(() => expect(w.exposed().isValid).toBe(false));
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid regex pattern');
      setRule('regex', '^abc');
      await waitFor(() => expect(w.exposed().isValid).toBe(true));
      expect(control()).toBe(input);
      expect(w.exposed().value).toBe(value);
      expect(w.variables().calls).toBeUndefined();
    });
  if (type === 'ShadNumberInput' || type === 'ShadCurrencyInput')
    describe.each([
      ['minValue', -5],
      ['maxValue', 5],
    ])('%s zero boundary', (key, badValue) => {
      test('numeric zero rule rejects out-of-range value', async () => {
        await mount();
        await w.act(action, badValue);
        setRule(key, '{{0}}');
        expect(w.exposed().isValid).toBe(false);
      });
      test('literal string zero rule rejects out-of-range value (control)', async () => {
        await mount();
        await w.act(action, badValue);
        setRule(key, '0');
        expect(w.exposed().isValid).toBe(false);
      });
      test('Form blocks out-of-range value under numeric zero rule', async () => {
        await mount(true);
        await w.act(action, badValue);
        w.setComponentProperty('form1', 'validateOnSubmit', '{{true}}', 'properties');
        w.setComponentProperty('form1', 'resetOnSubmit', '{{false}}', 'properties');
        w.setEvents([
          ...setVariableOn('form1', 'onSubmit', { key: 'captured', value: '{{components.form1.formData}}' }),
          ...countInvocationsOn('form1', 'onInvalid', { key: 'invalid' }),
        ]);
        setRule(key, '{{0}}');
        await act(async () => {
          await w.exposed('form1').submitForm();
        });
        expect({
          captured: w.variables().captured,
          invalid: w.variables().invalid,
          valid: w.exposed().isValid,
        }).toEqual({ captured: undefined, invalid: 1, valid: false });
      });
    });
});
