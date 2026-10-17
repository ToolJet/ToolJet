/**
 * UI 2.0 Phone input: a national number box behind a searchable country picker, exposed as E.164.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Phone input itself does. Titles carry [ShadPhoneInput-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'ph1';
const widget = createWidgetHarness({
  componentType: 'ShadPhoneInput',
  handle: 'phone1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 360,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const box = () => screen.getByRole('textbox', { name: /^Phone number/ });
const exposed = () => widget.exposed() ?? {};
const type = (text) => act(async () => fireEvent.change(box(), { target: { value: text } }));
const leave = async () => {
  await act(async () => box().focus());
  await act(async () => box().blur());
};
const openCountries = async (current = 'United States') => {
  await act(async () => fireEvent.click(screen.getByRole('button', { name: `Country: ${current}` })));
  return screen.findByPlaceholderText('Search country...');
};

describe('UI 2.0 Phone input', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadPhoneInput-DEF-001] shows its label, help text and the US calling code, and exposes an empty number', async () => {
    render({
      properties: { description: binding('We text the courier code'), placeholder: binding('(201) 555-0123') },
    });

    expect(await screen.findByText('We text the courier code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Country: United States' })).toHaveTextContent('+1');
    expect(box()).toHaveAttribute('placeholder', '(201) 555-0123');
    await waitFor(() => expect(exposed().country).toBe('US'));
    expect(exposed()).toMatchObject({
      value: '',
      countryCode: '+1',
      formattedValue: '',
      isValidNumber: false,
      label: 'Phone number',
      isValid: true,
      isMandatory: false,
    });
  });

  test('[ShadPhoneInput-PROP-001] defaultValue in E.164 fills the box in national format and exposes every shape', async () => {
    render({ properties: { defaultValue: binding('+14155550123') } });

    await waitFor(() => expect(box()).toHaveValue('(415) 555-0123'));
    expect(exposed()).toMatchObject({
      value: '+14155550123',
      formattedValue: '+1 415 555 0123',
      isValidNumber: true,
      country: 'US',
    });
  });

  test('[ShadPhoneInput-PROP-002] defaultCountry starts on that country', async () => {
    render({ properties: { defaultCountry: binding('GB') } });

    expect(await screen.findByRole('button', { name: 'Country: United Kingdom' })).toHaveTextContent('+44');
    await waitFor(() => expect(exposed()).toMatchObject({ country: 'GB', countryCode: '+44' }));
  });

  test('[ShadPhoneInput-PROP-003] onlyCountries limits the country list', async () => {
    render({ properties: { onlyCountries: binding("{{['US', 'CA']}}") } });

    await openCountries();

    const names = screen.getAllByRole('option').map((o) => o.textContent);
    expect(names).toHaveLength(2);
    expect(names.join(' ')).toMatch(/Canada/);
    expect(names.join(' ')).toMatch(/United States/);
  });

  test('[ShadPhoneInput-PROP-004] with isCountryChangeEnabled off the country is shown but cannot be changed', async () => {
    render({ properties: { isCountryChangeEnabled: binding('{{false}}') } });

    expect(await screen.findByLabelText('Country: United States')).toHaveTextContent('+1');
    expect(screen.queryByRole('button', { name: 'Country: United States' })).toBeNull();
  });

  test('[ShadPhoneInput-PROP-005] showFlag draws the country flag beside the code, and off leaves the code alone', async () => {
    render();
    const country = await screen.findByRole('button', { name: 'Country: United States' });
    await waitFor(() => expect(country.querySelector('svg')).not.toBeNull());
    const withFlag = country.querySelectorAll('svg').length;

    render({ properties: { showFlag: binding('{{false}}') } });
    await waitFor(() => expect(country.querySelectorAll('svg')).toHaveLength(withFlag - 1));
    expect(country).toHaveTextContent('+1');
  });

  test('[ShadPhoneInput-EVT-001] typing fires onChange, and its handler reads the number as E.164', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.phone1.value}}' }));

    await type('4155550123');

    await waitFor(() => expect(widget.variables().seen).toBe('+14155550123'));
    expect(exposed()).toMatchObject({ countryCode: '+1', formattedValue: '+1 415 555 0123', isValidNumber: true });
  });

  test('[ShadPhoneInput-EVT-002] picking a country from the searchable list fires onChange and moves the number there', async () => {
    render({ properties: { defaultValue: binding('+14155550123') } });
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.phone1.country}}' }));

    const search = await openCountries();
    await act(async () => fireEvent.change(search, { target: { value: 'germ' } }));
    await act(async () => fireEvent.click(screen.getByRole('option', { name: /Germany/ })));

    await waitFor(() => expect(widget.variables().seen).toBe('DE'));
    expect(exposed()).toMatchObject({ country: 'DE', countryCode: '+49', value: '+494155550123' });
    expect(screen.getByRole('button', { name: 'Country: Germany' })).toBeInTheDocument();
  });

  test('[ShadPhoneInput-EVT-003] Enter fires onEnterPressed, and focusing and leaving fire onFocus and onBlur', async () => {
    render();
    widget.setEvents([
      ...countInvocationsOn(ID, 'onEnterPressed', { key: 'enters' }),
      ...setVariableOn(ID, 'onFocus', { key: 'focused' }),
      ...setVariableOn(ID, 'onBlur', { key: 'blurred' }),
    ]);

    await act(async () => box().focus());
    await waitFor(() => expect(widget.variables().focused).toBe('YES'));
    await act(async () => fireEvent.keyDown(box(), { key: 'Enter' }));
    await waitFor(() => expect(widget.variables().enters).toBe(1));
    await act(async () => box().blur());
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadPhoneInput-ACT-001] setValue takes a national number with a country, or an international one', async () => {
    render();

    await widget.act('setValue', '4155550123', 'US');
    await waitFor(() => expect(exposed().value).toBe('+14155550123'));
    expect(box()).toHaveValue('(415) 555-0123');

    await widget.act('setValue', '+442071838750');
    await waitFor(() => expect(exposed().country).toBe('GB'));
    expect(exposed().value).toBe('+442071838750');
  });

  test('[ShadPhoneInput-ACT-002] setCountryCode switches country by calling code or ISO code, and clear empties the number', async () => {
    render({ properties: { defaultValue: binding('+14155550123') } });

    await widget.act('setCountryCode', '+44');
    await waitFor(() => expect(exposed()).toMatchObject({ country: 'GB', countryCode: '+44' }));
    await widget.act('setCountryCode', 'FR');
    await waitFor(() => expect(exposed().country).toBe('FR'));

    await widget.act('clear');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(box()).toHaveValue('');
  });

  // Compat fixtures (17 Oct): `await setValue(...); await clear();` in one RunJS query ended with the number set again.
  // The phone library copies `value` into its own state in an effect and reports that copy back as a change; the copy
  // from setValue landed after clear.
  test.each([
    [[['setValue', '2025550143', 'US'], ['clear']]],
    [[['setValue', '2025550143', 'US'], ['setCountryCode', 'GB'], ['clear']]],
    [[['clear'], ['setValue', '2025550143', 'US']]],
  ])('[ShadPhoneInput-ACT-004] actions run one after another in a query: %j', async (steps) => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onChange', { key: 'changes' }));
    const { after, settled } = await widget.runQuery(steps);
    const last = after[after.length - 1];
    expect(after.map((e) => e.value)).toEqual(
      steps.map(([name]) => (name === 'clear' ? '' : expect.stringMatching(/^\+\d+$/)))
    );
    expect({ value: settled.value, country: settled.country }).toEqual({ value: last.value, country: last.country });
    // onChange once per setValue and clear, as the native Phone input: none from the library's late copy.
    expect(widget.variables().changes).toBe(steps.filter(([name]) => name !== 'setCountryCode').length);
    expect(box()).toHaveValue(last.value ? '(202) 555-0143' : '');
  });

  // Release audit 34: an action restarted the phone library (a new key) every time, so a box the user was typing in
  // lost focus, even when the action changed nothing.
  test.each([
    ['the same country', 'setCountryCode', ['US'], '+12025550143'],
    ['the same number', 'setValue', ['2025550143', 'US'], '+12025550143'],
    ['a new number', 'setValue', ['4155550123', 'US'], '+14155550123'],
    ['a new country', 'setCountryCode', ['GB'], '+442025550143'],
    ['clear', 'clear', [], ''],
    ['an unknown country', 'setCountryCode', ['NOT_A_COUNTRY'], '+12025550143'],
  ])('[ShadPhoneInput-ACT-005] an action keeps a focused box focused: %s', async (_label, action, args, value) => {
    render({ properties: { defaultValue: binding('+12025550143'), defaultCountry: binding('US') } });
    await waitFor(() => expect(exposed().value).toBe('+12025550143'));
    await act(async () => box().focus());
    expect(box()).toHaveFocus();
    await widget.act(action, ...args);
    await waitFor(() => expect(exposed().value).toBe(value));
    expect(box()).toHaveFocus();
    // Typing goes on at the end of what the box shows.
    expect(box().selectionStart).toBe(box().value.length);
  });

  test('[ShadPhoneInput-ACT-003] setFocus and setBlur move focus to and from the box', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(box());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(box());
  });

  test('[ShadPhoneInput-VAL-001] a number that cannot exist is invalid and says so once the box is left', async () => {
    render();

    await type('415');
    await waitFor(() => expect(exposed().isValid).toBe(false));
    await leave();

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid phone number');
  });

  test('[ShadPhoneInput-VAL-002] a mandatory number is invalid while empty and says so once the box is left', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(exposed()).toMatchObject({ isValid: false, isMandatory: true }));

    await leave();
    expect(await screen.findByRole('alert')).toHaveTextContent('Field cannot be empty');

    await type('4155550123');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadPhoneInput-VAL-003] regex, minLength and maxLength check the E.164 value', async () => {
    render({
      validation: { regex: binding('^\\+(1|44|354)'), minLength: binding('{{12}}'), maxLength: binding('{{12}}') },
    });

    await widget.act('setValue', '+33142685300');
    await leave();
    expect(await screen.findByRole('alert')).toHaveTextContent('The input should match pattern');
    await widget.act('setValue', '+3545511234');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Minimum 12 characters is needed'));
    await widget.act('setValue', '+442071838750');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Maximum 12 characters is allowed'));
    await widget.act('setValue', '+14155550123');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadPhoneInput-VAL-004] a customRule message makes the number invalid and is shown under the box', async () => {
    render({ validation: { customRule: binding("{{components.phone1.country !== 'US' ? 'US numbers only' : ''}}") } });

    await widget.act('setValue', '+442071838750');
    await leave();

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('US numbers only')).toBeInTheDocument();
  });

  test('[ShadPhoneInput-STY-001] country picker and list colours reach the widget and its list as CSS variables', async () => {
    const { container } = render({
      styles: {
        borderColor: binding('#555555'),
        countryBackgroundColor: binding('#f4f4f5'),
        countryTextColor: binding('#18181b'),
        popoverBackgroundColor: binding('#ffffff'),
        popoverTextColor: binding('#0a0a0a'),
        hoverColor: binding('#e4e4e7'),
        selectedTextColor: binding('#fafafa'),
      },
    });

    await waitFor(() => expect(box()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--lk-border')).toBe('#555555');
    expect(root.getPropertyValue('--lk-addon-bg')).toBe('#f4f4f5');
    expect(root.getPropertyValue('--lk-addon-fg')).toBe('#18181b');
    // The list opens outside the widget, so it carries the variables itself.
    const search = await openCountries();
    const list = search.closest('[role=dialog]') || search.closest('[style]');
    expect(list.style.getPropertyValue('--sc-popover')).toBe('#ffffff');
    expect(list.style.getPropertyValue('--sc-popover-foreground')).toBe('#0a0a0a');
    expect(list.style.getPropertyValue('--sc-accent')).toBe('#e4e4e7');
    expect(list.style.getPropertyValue('--sc-primary-foreground')).toBe('#fafafa');
    expect(within(list).getAllByRole('option').length).toBeGreaterThan(1);
  });
});
