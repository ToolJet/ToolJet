// Release audit round 3 (Codex fixtures reviewPhoneCountryListRefresh, reviewPhoneRefreshSubmission,
// reviewPhoneClearRefresh and reviewPhoneRefocusEvents, trimmed). A new country list (reordered, appended, trimmed, or
// briefly empty while its query reruns) threw away the number the user had set or cleared, so the Form submitted the
// default; the list now starts the input again only when the current country is no longer offered. setValue and clear
// while the box had focus fired onFocus a second time: the restarted field took focus back as if the user had.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent } from '@testing-library/react';

const w = createWidgetHarness({ componentType: 'ShadPhoneInput', id: 'phone1', handle: 'phone1', preload: ['Form'] });
beforeEach(() => w.setup());
afterEach(() => w.teardown());

const mountInForm = () =>
  w.renderInsideForm({
    properties: {
      defaultCountry: binding('US'),
      defaultValue: binding('+14155552671'),
      onlyCountries: binding(['US', 'GB']),
    },
  });
const setCountries = (countries) =>
  act(async () => w.setComponentProperty('phone1', 'onlyCountries', countries, 'properties'));
const held = () => ({ value: w.exposed().value, form: w.exposed('form1').formData.phone1 });

test.each([
  ['reordered', [['GB', 'US']]],
  ['appended', [['US', 'GB', 'CA']]],
  ['trimmed to the current country', [['US']]],
  ['briefly empty', [[], ['US', 'GB']]],
])('a country list %s keeps the number set', async (_, lists) => {
  mountInForm();
  await w.act('setValue', '+14155552672');
  for (const list of lists) await setCountries(list);
  expect(held()).toEqual({ value: '+14155552672', form: '+14155552672' });
});

test('a country list without the current country starts the input again', async () => {
  mountInForm();
  await w.act('setValue', '+14155552672');
  await setCountries(['GB']);
  expect(w.exposed().country).toBe('GB');
  expect(w.exposed().value).toBe('');
});

test('a cleared number stays cleared when the country list is reordered', async () => {
  mountInForm();
  await w.act('clear');
  await setCountries(['GB', 'US']);
  expect(held()).toEqual({ value: '', form: '' });
});

test('a typed number survives a list refresh into the submission', async () => {
  mountInForm();
  await act(async () => {
    w.setComponentProperty('form1', 'resetOnSubmit', false, 'properties');
    w.setEvents(
      setVariableOn('form1', 'onSubmit', { key: 'submitted', value: '{{components.form1.formData.phone1}}' })
    );
  });
  await act(async () =>
    fireEvent.change(document.querySelector('input[type="tel"]'), { target: { value: '4155552672' } })
  );
  await setCountries(['GB', 'US']);
  await act(async () => w.exposed('form1').submitForm());
  expect(w.variables().submitted).toBe('+14155552672');
});

describe('actions while the box has focus', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  test.each([
    ['setValue', '+14155552672'],
    ['clear', undefined],
  ])('%s keeps focus without a second onFocus', async (action, arg) => {
    w.render({
      currentMode: 'view',
      properties: { defaultCountry: binding('US'), defaultValue: binding('+14155552671') },
    });
    await act(async () =>
      w.setEvents(setVariableOn('phone1', 'onFocus', { key: 'focuses', value: '{{(variables.focuses||0)+1}}' }))
    );
    await act(async () => document.querySelector('input[type="tel"]').focus());
    await act(async () => jest.advanceTimersByTime(1));
    expect(w.variables().focuses).toBe(1);
    await w.act(action, arg);
    await act(async () => jest.advanceTimersByTime(1));
    expect(document.activeElement).toBe(document.querySelector('input[type="tel"]'));
    expect(w.variables().focuses).toBe(1);
  });
});
