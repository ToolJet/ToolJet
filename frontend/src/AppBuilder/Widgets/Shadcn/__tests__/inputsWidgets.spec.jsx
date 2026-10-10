import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import {
  ShadCurrencyInput,
  ShadDateTimePicker,
  ShadNumberInput,
  ShadOtpInput,
  ShadPasswordInput,
  ShadPhoneInput,
  ShadTimePicker,
} from '../ShadInputs';
import { shadcnConfigs } from '../../../WidgetManager/widgets/shadcn';

// Radix popovers and cmdk measure and scroll elements, which jsdom does not do.
beforeAll(() => {
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || jest.fn();
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || jest.fn(() => false);
});

const WIDGETS = {
  ShadNumberInput,
  ShadPasswordInput,
  ShadPhoneInput,
  ShadCurrencyInput,
  ShadOtpInput,
  ShadTimePicker,
  ShadDateTimePicker,
};

// The config's definition values as the editor resolves them: '{{...}}' is evaluated.
const resolve = (v) => {
  const m = typeof v === 'string' ? v.match(/^\{\{([\s\S]*)\}\}$/) : null;
  return m ? new Function(`return (${m[1]});`)() : v; // eslint-disable-line no-new-func
};
const defaultsOf = (name) => {
  const cfg = shadcnConfigs.find((c) => c.name === name);
  return Object.fromEntries(Object.entries(cfg.definition.properties).map(([k, { value }]) => [k, resolve(value)]));
};

const mount = (name, properties = {}, { validate, validation = {} } = {}) => {
  const Widget = WIDGETS[name];
  const exposed = {};
  const events = [];
  const utils = render(
    <Widget
      id="w1"
      componentType={name}
      properties={{ ...defaultsOf(name), ...properties }}
      styles={{}}
      validation={validation}
      validate={validate || (() => ({ isValid: true }))}
      setExposedVariables={(values) => Object.assign(exposed, values)}
      setExposedVariable={(key, value) => (exposed[key] = value)}
      fireEvent={(event) => events.push(event)}
    />
  );
  return { exposed, events, ...utils };
};

const JUNK_SETS = [null, {}, [1, 'a', null, {}], NaN, 'zzz', 1e308, -1, true];

describe('inputs widgets render', () => {
  Object.keys(WIDGETS).forEach((name) => {
    it(`${name} renders its defaults and survives junk`, () => {
      const { exposed, unmount } = mount(name);
      expect(exposed.isVisible).toBe(true);
      expect(exposed).toHaveProperty('value');
      unmount();
      JUNK_SETS.forEach((junk) => {
        const props = Object.fromEntries(Object.keys(defaultsOf(name)).map((k) => [k, junk]));
        const { unmount: off } = mount(name, { ...props, visibility: true, loadingState: false });
        off();
      });
      // Loading: the field look keeps the control, with a spinner.
      mount(name, { loadingState: true });
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });
  });
});

describe('ShadNumberInput', () => {
  it('rounds typed numbers, steps and stops at the validation bounds', async () => {
    const { exposed, events } = mount('ShadNumberInput', { defaultValue: 4 }, { validation: { maxValue: 5 } });
    const input = screen.getByRole('spinbutton');
    expect(exposed.value).toBe(4);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '1,234.567' } });
    expect(exposed.value).toBe(1234.57);
    expect(events).toContain('onChange');
    fireEvent.blur(input);
    expect(input.value).toBe('1,234.57');
    expect(events).toContain('onBlur');
    await act(() => exposed.setValue(4));
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(exposed.value).toBe(5);
    expect(screen.getByRole('button', { name: 'Increase' }).disabled).toBe(true);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(exposed.value).toBe(4);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(events).toContain('onEnterPressed');
    await act(() => exposed.clear());
    expect(exposed.value).toBeNull();
  });
});

describe('ShadPasswordInput', () => {
  it('reveals the password and rates its strength', () => {
    const { exposed, events } = mount('ShadPasswordInput', { showStrength: true });
    const input = document.getElementById('shad-w1');
    expect(input.type).toBe('password');
    fireEvent.change(input, { target: { value: 'Tr0ub4dor&3-horse' } });
    expect(exposed.value).toBe('Tr0ub4dor&3-horse');
    expect(exposed.strength).toBe('strong');
    expect(screen.getByText('Strong')).toBeTruthy();
    expect(events).toEqual(['onChange']);
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input.type).toBe('text');
  });
});

describe('ShadPhoneInput', () => {
  it('exposes the typed number as E.164 and fails validation for a bad number', () => {
    const { exposed, events } = mount('ShadPhoneInput');
    const input = document.getElementById('shad-w1');
    fireEvent.change(input, { target: { value: '4155550123' } });
    expect(exposed).toMatchObject({
      value: '+14155550123',
      country: 'US',
      countryCode: '+1',
      formattedValue: '+1 415 555 0123',
      isValidNumber: true,
      isValid: true,
    });
    expect(events).toContain('onChange');
    fireEvent.change(input, { target: { value: '415' } });
    expect(exposed.isValid).toBe(false);
    fireEvent.blur(input);
    expect(screen.getByRole('alert').textContent).toBe('Enter a valid phone number');
  });

  it('changes country from the searchable list and by action', async () => {
    const { exposed } = mount('ShadPhoneInput', { defaultValue: '+14155550123' });
    fireEvent.click(screen.getByRole('button', { name: 'Country: United States' }));
    const search = screen.getByPlaceholderText('Search country...');
    fireEvent.change(search, { target: { value: 'germ' } });
    fireEvent.click(screen.getByRole('option', { name: /Germany/ }));
    expect(exposed).toMatchObject({ country: 'DE', countryCode: '+49', value: '+494155550123' });
    await act(() => exposed.setCountry('+44'));
    expect(exposed.country).toBe('GB');
  });
});

describe('ShadCurrencyInput', () => {
  it('formats the amount for the locale and exposes the number', () => {
    const { exposed, events } = mount('ShadCurrencyInput');
    const input = document.getElementById('shad-w1');
    expect(input.value).toBe('1,250.00');
    expect(screen.getByText('$')).toBeTruthy();
    expect(exposed).toMatchObject({ value: 1250, formattedValue: '$1,250.00', currency: 'USD' });
    fireEvent.focus(input);
    expect(input.value).toBe('1250');
    fireEvent.change(input, { target: { value: '99.999' } });
    expect(exposed).toMatchObject({ value: 100, formattedValue: '$100.00' });
    expect(events).toContain('onChange');
    fireEvent.blur(input);
    expect(input.value).toBe('100.00');
  });

  it('puts the sign where the locale writes it', () => {
    mount('ShadCurrencyInput', { currency: 'EUR', locale: 'de-DE', defaultValue: 1234.5 });
    expect(document.getElementById('shad-w1').value).toBe('1.234,50');
    expect(screen.getByText('€')).toBeTruthy();
  });
});

describe('ShadOtpInput', () => {
  it('takes a pasted code and fires onComplete', async () => {
    const { exposed, events } = mount('ShadOtpInput');
    const input = document.getElementById('shad-w1');
    expect(document.querySelectorAll('[data-slot="otp"]')).toHaveLength(6);
    fireEvent.change(input, { target: { value: '12' } });
    expect(exposed).toMatchObject({ value: '12', isComplete: false });
    fireEvent.blur(input);
    expect(screen.getByRole('alert').textContent).toBe('Enter all 6 characters');
    fireEvent.change(input, { target: { value: '123-456' } });
    expect(exposed).toMatchObject({ value: '123456', isComplete: true, isValid: true });
    expect(events).toEqual(['onChange', 'onChange', 'onComplete']);
    await act(() => exposed.clear());
    expect(exposed.value).toBe('');
  });

  it('splits the boxes with a separator and masks', () => {
    mount('ShadOtpInput', { length: 4, separator: true, masked: true, defaultValue: '1234' });
    expect(screen.getByRole('separator')).toBeTruthy();
    expect(screen.getAllByText('•')).toHaveLength(4);
  });
});

describe('ShadTimePicker', () => {
  it('picks a time from the columns', async () => {
    const { exposed, events } = mount('ShadTimePicker');
    fireEvent.click(screen.getByRole('button', { name: 'Time' }));
    fireEvent.click(screen.getByRole('option', { name: '09' }));
    expect(exposed).toMatchObject({ value: '09:00', formattedValue: '9:00 AM' });
    fireEvent.click(screen.getByRole('option', { name: 'PM' }));
    fireEvent.click(screen.getByRole('option', { name: '30' }));
    expect(exposed).toMatchObject({ value: '21:30', formattedValue: '9:30 PM' });
    expect(events).toEqual(['onChange', 'onChange', 'onChange']);
    await act(() => exposed.setTime('14:15'));
    expect(exposed.value).toBe('14:15');
  });

  it('picks from a list within the bounds, and flags a default outside them', () => {
    const { exposed } = mount(
      'ShadTimePicker',
      { pickerStyle: 'list', minTime: '09:00', maxTime: '10:00', timeFormat: '24h', defaultValue: '08:00' },
      {}
    );
    expect(exposed.isValid).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Time' }));
    const list = screen.getByRole('listbox', { name: 'Times' });
    expect(
      within(list)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['09:00', '09:15', '09:30', '09:45', '10:00']);
    fireEvent.click(within(list).getByText('09:45'));
    expect(exposed).toMatchObject({ value: '09:45', isValid: true });
  });
});

describe('ShadDateTimePicker', () => {
  it('picks a day, keeps the time and exposes every shape', async () => {
    const { exposed, events } = mount('ShadDateTimePicker', { defaultValue: '2026-10-15 09:30' });
    expect(exposed).toMatchObject({ value: '2026-10-15T09:30', selectedDate: '2026-10-15', selectedTime: '09:30' });
    expect(screen.getByRole('button', { name: 'Date and time' }).textContent).toBe('15 Oct 2026 9:30 AM');
    fireEvent.click(screen.getByRole('button', { name: 'Date and time' }));
    fireEvent.click(screen.getByText('20'));
    expect(exposed).toMatchObject({ value: '2026-10-20T09:30', displayValue: '20 Oct 2026 9:30 AM' });
    expect(exposed.unixTimestamp).toBe(new Date(2026, 9, 20, 9, 30).getTime());
    expect(events).toEqual(['onChange']);
    fireEvent.click(screen.getByRole('button', { name: 'PM' }));
    expect(exposed.selectedTime).toBe('21:30');
    await act(() => exposed.setDate('2027-01-02T08:00'));
    expect(exposed.value).toBe('2027-01-02T08:00');
    await act(() => exposed.clear());
    expect(exposed.value).toBe('');
  });

  it('blocks days outside min/max and fails validation for them', () => {
    const { exposed } = mount('ShadDateTimePicker', {
      defaultValue: '2026-10-25 10:00',
      maxDate: '2026-10-18',
      disabledDates: ['2026-10-12'],
    });
    expect(exposed.isValid).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Date and time' }));
    expect(screen.getByText('20').closest('button').disabled).toBe(true);
    expect(screen.getByText('12').closest('button').disabled).toBe(true);
    fireEvent.click(screen.getByText('16'));
    expect(exposed).toMatchObject({ value: '2026-10-16T10:00', isValid: true });
  });
});
