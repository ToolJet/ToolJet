/**
 * UI 2.0 Currency input: an amount box written the locale's way, with its currency sign or a currency picker.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Currency input itself does. Titles carry [ShadCurrencyInput-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'cur1';
const widget = createWidgetHarness({
  componentType: 'ShadCurrencyInput',
  handle: 'currency1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 360,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const box = () => screen.getByRole('textbox', { name: /^Amount/ });
const exposed = () => widget.exposed() ?? {};
const type = async (text) => {
  await act(async () => box().focus());
  await act(async () => fireEvent.change(box(), { target: { value: text } }));
};
const leave = () => act(async () => box().blur());
/** Opens the currency list the way a pointer does and picks a currency by keyboard. */
const pickCurrency = async (code) => {
  await act(async () => {
    fireEvent.pointerDown(screen.getByRole('combobox', { name: 'Currency' }), {
      button: 0,
      pointerType: 'mouse',
      ctrlKey: false,
    });
  });
  const option = await screen.findByRole('option', { name: new RegExp(`^${code}`) });
  await act(async () => fireEvent.keyDown(option, { key: 'Enter' }));
};

describe('UI 2.0 Currency input', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadCurrencyInput-DEF-001] shows the default amount with its sign, and exposes the number and its text', async () => {
    render({ properties: { description: binding('Before tax'), placeholder: binding('Enter an amount') } });

    expect(await screen.findByText('Before tax')).toBeInTheDocument();
    expect(box()).toHaveValue('1,250.00');
    expect(box()).toHaveAttribute('placeholder', 'Enter an amount');
    expect(screen.getByText('$')).toBeInTheDocument();
    await waitFor(() => expect(exposed().value).toBe(1250));
    expect(exposed()).toMatchObject({
      formattedValue: '$1,250.00',
      currency: 'USD',
      label: 'Amount',
      isValid: true,
      isMandatory: false,
    });
  });

  test('[ShadCurrencyInput-PROP-001] defaultValue, currency and locale write the amount and sign where the locale puts them', async () => {
    render({ properties: { currency: binding('EUR'), locale: binding('de-DE'), defaultValue: binding('{{1234.5}}') } });

    await waitFor(() => expect(box()).toHaveValue('1.234,50'));
    expect(screen.getByText('€')).toBeInTheDocument();
    expect(exposed()).toMatchObject({ value: 1234.5, currency: 'EUR' });
    expect(exposed().formattedValue).toMatch(/^1\.234,50\s€$/);
  });

  test('[ShadCurrencyInput-PROP-002] decimalPlaces overrides the currency own decimals', async () => {
    render({ properties: { currency: binding('JPY') } });
    await waitFor(() => expect(box()).toHaveValue('1,250'));

    render({
      properties: { currency: binding('USD'), decimalPlaces: binding('{{3}}'), defaultValue: binding('{{2.5}}') },
    });
    await waitFor(() => expect(box()).toHaveValue('2.500'));
    expect(exposed().formattedValue).toBe('$2.500');
  });

  test('[ShadCurrencyInput-PROP-003] currencyDisplay shows the sign as a symbol, a narrow symbol or the code', async () => {
    render({ properties: { currency: binding('CAD') } });
    expect(await screen.findByText('CA$')).toBeInTheDocument();

    render({ properties: { currency: binding('CAD'), currencyDisplay: binding('narrowSymbol') } });
    expect(await screen.findByText('$')).toBeInTheDocument();

    render({ properties: { currency: binding('CAD'), currencyDisplay: binding('code') } });
    expect(await screen.findByText('CAD')).toBeInTheDocument();
  });

  test('[ShadCurrencyInput-PROP-004] currencyOptions add a currency picker; a pick re-rounds the amount and fires onChange', async () => {
    render({
      properties: { currencyOptions: binding("{{['USD', 'EUR', 'JPY']}}"), defaultValue: binding('{{12.5}}') },
    });
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.currency1.currency}}' }));
    expect(await screen.findByRole('combobox', { name: 'Currency' })).toHaveTextContent('USD');

    await pickCurrency('JPY');

    await waitFor(() => expect(widget.variables().seen).toBe('JPY'));
    expect(exposed()).toMatchObject({ value: 13, formattedValue: '¥13' });
    expect(box()).toHaveValue('13');
  });

  test('[ShadCurrencyInput-EVT-001] typing fires onChange, and its handler reads the rounded number', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.currency1.value}}' }));

    // Focus shows the plain number to edit; blur writes it the locale's way again.
    await act(async () => box().focus());
    expect(box()).toHaveValue('1250');
    await type('99.999');

    await waitFor(() => expect(widget.variables().seen).toBe(100));
    expect(exposed().formattedValue).toBe('$100.00');
    await leave();
    expect(box()).toHaveValue('100.00');
  });

  test('[ShadCurrencyInput-EVT-002] Enter fires onEnterPressed, and focusing and leaving fire onFocus and onBlur', async () => {
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
    await leave();
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadCurrencyInput-ACT-001] setValue sets the amount and, given one, the currency; setCurrency changes the currency', async () => {
    render();

    await widget.act('setValue', 99.5, 'EUR');
    await waitFor(() => expect(exposed()).toMatchObject({ value: 99.5, currency: 'EUR', formattedValue: '€99.50' }));
    expect(box()).toHaveValue('99.50');

    await widget.act('setCurrency', 'GBP');
    await waitFor(() => expect(exposed().currency).toBe('GBP'));
    expect(exposed().formattedValue).toBe('£99.50');
    expect(screen.getByText('£')).toBeInTheDocument();
  });

  // setValue(12.345, 'JPY') once kept the old currency's two decimals in its value (12.35) while showing '12'.
  test('[ShadCurrencyInput-ACT-003] setValue with a currency rounds the amount to that currency', async () => {
    render();

    await widget.act('setValue', 12.345, 'JPY');

    await waitFor(() => expect(exposed().currency).toBe('JPY'));
    expect(box()).toHaveValue('12');
    expect(exposed()).toMatchObject({ value: 12, formattedValue: '¥12' });
  });

  test('[ShadCurrencyInput-ACT-002] clear empties the amount, and setFocus and setBlur move focus', async () => {
    render();

    await widget.act('clear');
    await waitFor(() => expect(box()).toHaveValue(''));
    expect(exposed().value).toBeNull();
    expect(exposed().formattedValue).toBe('');

    await widget.act('setFocus');
    expect(document.activeElement).toBe(box());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(box());
  });

  test('[ShadCurrencyInput-VAL-001] minValue and maxValue reject an amount outside them once the box is left', async () => {
    render({ validation: { minValue: binding('{{10}}'), maxValue: binding('{{2000}}') } });
    await waitFor(() => expect(exposed().isValid).toBe(true));

    await type('5000');
    await leave();
    expect(await screen.findByRole('alert')).toHaveTextContent('Maximum value is 2000');
    await type('5');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Minimum value is 10'));
    expect(exposed().isValid).toBe(false);
  });

  test('[ShadCurrencyInput-VAL-002] a mandatory amount is invalid once emptied', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(exposed()).toMatchObject({ isValid: true, isMandatory: true }));

    await type('');
    await leave();

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByRole('alert')).toHaveTextContent('Field cannot be empty');
  });

  test('[ShadCurrencyInput-VAL-003] a customRule message makes the amount invalid and is shown under the box', async () => {
    render({ validation: { customRule: binding("{{components.currency1.value > 1000 ? 'Needs approval' : ''}}") } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    await act(async () => box().focus());
    await leave();
    expect(await screen.findByText('Needs approval')).toBeInTheDocument();
  });

  test('[ShadCurrencyInput-STY-001] sign, currency picker and list colours reach the widget as CSS variables', async () => {
    const { container } = render({
      properties: { currencyOptions: binding("{{['USD', 'EUR']}}") },
      styles: {
        affixColor: binding('#71717a'),
        currencyBackgroundColor: binding('#f4f4f5'),
        currencyTextColor: binding('#18181b'),
        popoverBackgroundColor: binding('#ffffff'),
        popoverTextColor: binding('#0a0a0a'),
        hoverColor: binding('#e4e4e7'),
        selectedTextColor: binding('#fafafa'),
      },
    });

    await waitFor(() => expect(box()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--lk-affix')).toBe('#71717a');
    expect(root.getPropertyValue('--lk-addon-bg')).toBe('#f4f4f5');
    expect(root.getPropertyValue('--lk-addon-fg')).toBe('#18181b');
    expect(root.getPropertyValue('--sc-popover')).toBe('#ffffff');
    expect(root.getPropertyValue('--sc-popover-foreground')).toBe('#0a0a0a');
    expect(root.getPropertyValue('--sc-accent')).toBe('#e4e4e7');
    expect(root.getPropertyValue('--sc-primary-foreground')).toBe('#fafafa');
  });
});
