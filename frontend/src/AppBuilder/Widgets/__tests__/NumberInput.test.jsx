import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NumberInput } from '../NumberInput';

// useInput pulls in stores/context/phone libs that are irrelevant to the value
// normalization under test.
jest.mock('@/_stores/gridStore', () => ({
  useGridStore: jest.fn(() => undefined),
}));
jest.mock('@/AppBuilder/Widgets/Form/FormSignalContext', () => ({
  useShowValidationOnFormSubmit: jest.fn(),
  useFormClear: jest.fn(),
}));
jest.mock('react-phone-number-input', () => ({
  getCountryCallingCode: () => '1',
  formatPhoneNumberIntl: (value) => value,
}));

let baseInputProps;
jest.mock('../BaseComponents/BaseInput', () => ({
  BaseInput: (props) => {
    baseInputProps = props;
    // Mirrors BaseInput's real clear-button gating:
    // shouldShowClearBtn = showClearBtn && hasValue && !disable && !loading
    const hasValue = props.value !== '' && props.value !== null && props.value !== undefined;
    return (
      <div>
        <input
          data-testid="number-input"
          value={String(props.value)}
          onChange={props.handleChange}
          onBlur={props.handleBlur}
        />
        {props.showClearBtn && hasValue ? <button data-testid="clear-btn">clear</button> : null}
      </div>
    );
  },
}));

const renderNumberInput = (properties) =>
  render(
    <NumberInput
      id="numberinput1"
      properties={properties}
      styles={{}}
      validation={{}}
      validate={() => ({ isValid: true, validationError: '' })}
      setExposedVariable={jest.fn()}
      fireEvent={jest.fn()}
      darkMode={false}
    />
  );

describe('NumberInput value normalization (#17550)', () => {
  it('does not treat an empty value as NaN, so the clear button stays hidden on an empty input', () => {
    renderNumberInput({ value: '', decimalPlaces: 2, showClearBtn: true });

    expect(baseInputProps.value).toBe('');
    expect(screen.queryByTestId('clear-btn')).toBeNull();
  });

  it.each([undefined, null])('maps an absent value (%s) to an empty string, not NaN', (absent) => {
    renderNumberInput({ value: absent, decimalPlaces: 2, showClearBtn: true });

    expect(baseInputProps.value).toBe('');
    expect(screen.queryByTestId('clear-btn')).toBeNull();
  });

  it('shows the clear button when a numeric value is present', () => {
    renderNumberInput({ value: 42, decimalPlaces: 2, showClearBtn: true });

    expect(baseInputProps.value).toBe(42);
    expect(screen.getByTestId('clear-btn')).toBeInTheDocument();
  });

  it('rounds numeric values to the configured decimal places', () => {
    renderNumberInput({ value: 3.14159, decimalPlaces: 2, showClearBtn: true });

    expect(baseInputProps.value).toBe(3.14);
  });

  it('keeps the value an empty string (not NaN) after blurring an emptied input', () => {
    renderNumberInput({ value: 5, decimalPlaces: 2, showClearBtn: true });

    const input = screen.getByTestId('number-input');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(baseInputProps.value).toBe('');
    expect(screen.queryByTestId('clear-btn')).toBeNull();
  });
});
