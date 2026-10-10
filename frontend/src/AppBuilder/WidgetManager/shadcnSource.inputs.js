// shadcn/ui pack (experiment): inputs widgets: number, password, phone, currency, OTP, time and date-time. Components
// in Widgets/Shadcn/ShadInputs.jsx, logic in Widgets/Shadcn/inputsModel.js, style variables in Widgets/Shadcn/looks/inputs.js.
import {
  ARRAY,
  NUMBER,
  STRING,
  choice,
  choiceValidation,
  code,
  colorStyle,
  numberValidation,
  shadConfig,
  sizeStyle,
  textValidation,
  toggle,
} from './shadcnPackHelpers.js';

const NUMBER_OR_TEXT = { type: 'union', schemas: [NUMBER, STRING] };
const ANY_DATE = { type: 'union', schemas: [STRING, NUMBER] };

// The text-box styles of ShadInput (shadcnSource.js), so every pack field takes the same look.
const fieldStyles = {
  labelColor: colorStyle('Label color'),
  helpTextColor: colorStyle('Help text color'),
  backgroundColor: colorStyle('Field background'),
  textColor: colorStyle('Field text color'),
  placeholderColor: colorStyle('Placeholder color'),
  borderColor: colorStyle('Field border color'),
  accentColor: colorStyle('Accent (focus ring, selection)'),
  errorColor: colorStyle('Error color (message and border)'),
  borderRadius: sizeStyle('Field radius'),
};
// Lists that open from a field (country list, currency list, time columns, calendar).
const popoverStyles = {
  popoverBackgroundColor: colorStyle('Popover background'),
  popoverTextColor: colorStyle('Popover text color'),
  hoverColor: colorStyle('Popover item hover background'),
  selectedTextColor: colorStyle('Selected item text color (on the accent)'),
};

const fieldProperties = (label) => ({
  label: code('Label', STRING, label),
  description: code('Help text', STRING, ''),
});
const fieldDefaults = (label) => ({ label: { value: label }, description: { value: '' } });

const SIZING =
  'Height: 64px with a label (label above the control), 36px without; add 24px for help text or a validation message';

const textBoxEvents = {
  onChange: { displayName: 'On change' },
  onEnterPressed: { displayName: 'On enter pressed' },
  onFocus: { displayName: 'On focus' },
  onBlur: { displayName: 'On blur' },
};
const focusActions = [
  { handle: 'setFocus', displayName: 'Set focus' },
  { handle: 'setBlur', displayName: 'Set blur' },
];
const valueAction = (handle, displayName, paramName = 'Value') => ({
  handle,
  displayName,
  params: [{ handle: 'value', displayName: paramName, defaultValue: '' }],
});
const CLEAR = { handle: 'clear', displayName: 'Clear' };

// ---- Number --------------------------------------------------------------------------------------------------------

export const shadNumberInputConfig = shadConfig({
  name: 'ShadNumberInput',
  displayName: 'Number input',
  description: `shadcn/ui number input: value is a number (null when empty), rounded to decimalPlaces; step buttons (stepper: split -/+ at both ends, stacked arrows at the right, or none) and ArrowUp/ArrowDown move by step and stop at the Min/Max value validation; optional prefix/suffix text inside the box (e.g. '$', 'kg') and thousands separators. ${SIZING}`,
  defaultSize: { width: 10, height: 64 },
  properties: {
    ...fieldProperties('Quantity'),
    placeholder: code('Placeholder', STRING, '0'),
    defaultValue: code('Default value', NUMBER_OR_TEXT, 1),
    decimalPlaces: code('Decimal places', NUMBER, 2),
    step: code('Step', NUMBER, 1),
    stepper: choice('Step buttons', ['split', 'stacked', 'none'], 'split', {
      split: 'Split -/+',
      stacked: 'Stacked',
      none: 'None',
    }),
    prefix: code('Prefix (inside the box)', STRING, ''),
    suffix: code('Suffix (inside the box)', STRING, ''),
    thousandSeparator: toggle('Thousands separators', true),
  },
  defaults: {
    ...fieldDefaults('Quantity'),
    placeholder: { value: '0' },
    defaultValue: { value: '{{1}}' },
    decimalPlaces: { value: '{{2}}' },
    step: { value: '{{1}}' },
    stepper: { value: 'split' },
    prefix: { value: '' },
    suffix: { value: '' },
    thousandSeparator: { value: '{{true}}' },
  },
  styles: {
    ...fieldStyles,
    stepperBackgroundColor: colorStyle('Step button background'),
    stepperIconColor: colorStyle('Step button icon color'),
    stepperHoverColor: colorStyle('Step button hover background'),
    affixColor: colorStyle('Prefix and suffix color'),
  },
  validation: numberValidation,
  events: textBoxEvents,
  exposedVariables: { isValid: true, isMandatory: false, value: 1 },
  actions: [valueAction('setValue', 'Set value'), CLEAR, ...focusActions],
});

// ---- Password ------------------------------------------------------------------------------------------------------

export const shadPasswordInputConfig = shadConfig({
  name: 'ShadPasswordInput',
  displayName: 'Password input',
  description: `shadcn/ui password input with a show/hide eye button (showToggle) and an optional strength meter (showStrength: a three-part weak/fair/strong bar under the box, exposed as strength = '' | 'weak' | 'fair' | 'strong'). Validate with the text rules (mandatory, regex, min length). ${SIZING}; the strength meter adds 16px`,
  defaultSize: { width: 10, height: 64 },
  properties: {
    ...fieldProperties('Password'),
    placeholder: code('Placeholder', STRING, ''),
    defaultValue: code('Default value', STRING, ''),
    showToggle: toggle('Show/hide button', true),
    showStrength: toggle('Strength meter', false),
  },
  defaults: {
    ...fieldDefaults('Password'),
    placeholder: { value: '' },
    defaultValue: { value: '' },
    showToggle: { value: '{{true}}' },
    showStrength: { value: '{{false}}' },
  },
  styles: {
    ...fieldStyles,
    iconColor: colorStyle('Eye icon color'),
    weakColor: colorStyle('Strength color: weak'),
    fairColor: colorStyle('Strength color: fair'),
    strongColor: colorStyle('Strength color: strong'),
    meterTrackColor: colorStyle('Strength meter track color'),
  },
  validation: textValidation,
  events: textBoxEvents,
  exposedVariables: { isValid: true, isMandatory: false, value: '', strength: '' },
  actions: [valueAction('setText', 'Set text', 'Text'), CLEAR, ...focusActions],
});

// ---- Phone ---------------------------------------------------------------------------------------------------------

export const shadPhoneInputConfig = shadConfig({
  name: 'ShadPhoneInput',
  displayName: 'Phone input',
  description: `shadcn/ui phone number input: a country picker (flag and calling code; searchable list) attached to the number box, which formats as you type. Exposes value (E.164, e.g. '+14155550123', '' when empty), country ('US'), countryCode ('+1'), formattedValue ('+1 415 555 0123') and isValidNumber; isValid is false for an invalid number. defaultCountry is an ISO code; onlyCountries limits the list (['US', 'CA']). ${SIZING}`,
  defaultSize: { width: 10, height: 64 },
  properties: {
    ...fieldProperties('Phone number'),
    placeholder: code('Placeholder', STRING, ''),
    defaultValue: code('Default value (E.164 or a national number)', STRING, ''),
    defaultCountry: code('Default country (ISO code)', STRING, 'US'),
    onlyCountries: code('Countries offered (ISO codes; empty: all)', ARRAY, [], {
      placeholder: "['US', 'CA', 'GB']",
    }),
    isCountryChangeEnabled: toggle('Enable country change', true),
    showFlag: toggle('Show country flag', true),
  },
  defaults: {
    ...fieldDefaults('Phone number'),
    placeholder: { value: '' },
    defaultValue: { value: '' },
    defaultCountry: { value: 'US' },
    onlyCountries: { value: '{{[]}}' },
    isCountryChangeEnabled: { value: '{{true}}' },
    showFlag: { value: '{{true}}' },
  },
  styles: {
    ...fieldStyles,
    countryBackgroundColor: colorStyle('Country button background'),
    countryTextColor: colorStyle('Country button text color'),
    ...popoverStyles,
  },
  validation: textValidation,
  events: textBoxEvents,
  exposedVariables: {
    isValid: true,
    isMandatory: false,
    value: '',
    country: 'US',
    countryCode: '+1',
    formattedValue: '',
    isValidNumber: false,
  },
  actions: [
    valueAction('setValue', 'Set value', 'Number (E.164 or national)'),
    {
      handle: 'setCountry',
      displayName: 'Set country',
      params: [{ handle: 'country', displayName: 'Country (ISO code or +calling code)', defaultValue: 'US' }],
    },
    CLEAR,
    ...focusActions,
  ],
});

// ---- Currency ------------------------------------------------------------------------------------------------------

export const shadCurrencyInputConfig = shadConfig({
  name: 'ShadCurrencyInput',
  displayName: 'Currency input',
  description: `shadcn/ui currency amount input: the currency sign inside the box, the amount formatted for the locale with Intl (1,250.00 in en-US, 1.250,00 in de-DE). Exposes value (a number, null when empty), formattedValue ('$1,250.00') and currency ('USD'). currency is an ISO code; currencyOptions (['USD', 'EUR', 'GBP']) adds a currency picker at the start of the box; decimalPlaces empty uses the currency's own (JPY 0). ${SIZING}`,
  defaultSize: { width: 10, height: 64 },
  properties: {
    ...fieldProperties('Amount'),
    placeholder: code('Placeholder', STRING, '0.00'),
    defaultValue: code('Default value', NUMBER_OR_TEXT, 1250),
    currency: code('Currency (ISO code)', STRING, 'USD'),
    currencyOptions: code('Currencies to choose from (empty: fixed)', ARRAY, [], {
      placeholder: "['USD', 'EUR', 'GBP']",
    }),
    locale: code('Number format locale', STRING, 'en-US', { placeholder: 'en-US, de-DE, en-IN' }),
    decimalPlaces: code("Decimal places (empty: the currency's own)", NUMBER_OR_TEXT, ''),
    currencyDisplay: choice('Currency sign', ['symbol', 'narrowSymbol', 'code'], 'symbol', {
      symbol: 'Symbol',
      narrowSymbol: 'Narrow',
      code: 'Code',
    }),
  },
  defaults: {
    ...fieldDefaults('Amount'),
    placeholder: { value: '0.00' },
    defaultValue: { value: '{{1250}}' },
    currency: { value: 'USD' },
    currencyOptions: { value: '{{[]}}' },
    locale: { value: 'en-US' },
    decimalPlaces: { value: '' },
    currencyDisplay: { value: 'symbol' },
  },
  styles: {
    ...fieldStyles,
    affixColor: colorStyle('Currency sign color'),
    currencyBackgroundColor: colorStyle('Currency picker background'),
    currencyTextColor: colorStyle('Currency picker text color'),
    ...popoverStyles,
  },
  validation: numberValidation,
  events: textBoxEvents,
  exposedVariables: { isValid: true, isMandatory: false, value: 1250, formattedValue: '$1,250.00', currency: 'USD' },
  actions: [
    valueAction('setValue', 'Set value'),
    {
      handle: 'setCurrency',
      displayName: 'Set currency',
      params: [{ handle: 'currency', displayName: 'Currency (ISO code)', defaultValue: 'USD' }],
    },
    CLEAR,
    ...focusActions,
  ],
});

// ---- OTP -----------------------------------------------------------------------------------------------------------

export const shadOtpInputConfig = shadConfig({
  name: 'ShadOtpInput',
  displayName: 'OTP input',
  description: `shadcn/ui one-time code input: length (4 to 8) character boxes, numeric or alphanumeric (upper-cased), typing moves to the next box, Backspace goes back, pasting a whole code fills it ('123-456' works). Optional separator in the middle and masked dots. Exposes value and isComplete; onComplete fires when the last box is filled (verify there). Boxes are 36px (slotSize style); height 64px with a label, 36px without`,
  defaultSize: { width: 10, height: 64 },
  properties: {
    ...fieldProperties('Verification code'),
    length: code('Length (4 to 8)', NUMBER, 6),
    characters: choice('Characters', ['numeric', 'alphanumeric'], 'numeric', {
      numeric: 'Digits',
      alphanumeric: 'Letters and digits',
    }),
    separator: toggle('Separator in the middle', false),
    slotStyle: choice('Boxes', ['joined', 'separate'], 'joined'),
    masked: toggle('Mask characters', false),
    placeholder: code('Placeholder (one character per box)', STRING, ''),
    defaultValue: code('Default value', STRING, ''),
  },
  defaults: {
    ...fieldDefaults('Verification code'),
    length: { value: '{{6}}' },
    characters: { value: 'numeric' },
    separator: { value: '{{false}}' },
    slotStyle: { value: 'joined' },
    masked: { value: '{{false}}' },
    placeholder: { value: '' },
    defaultValue: { value: '' },
  },
  styles: {
    ...fieldStyles,
    separatorColor: colorStyle('Separator color'),
    slotSize: sizeStyle('Box size'),
  },
  validation: textValidation,
  events: {
    onChange: { displayName: 'On change' },
    onComplete: { displayName: 'On complete' },
    onFocus: { displayName: 'On focus' },
  },
  exposedVariables: { isValid: true, isMandatory: false, value: '', isComplete: false },
  actions: [CLEAR, { handle: 'setFocus', displayName: 'Set focus' }],
});

// ---- Time ----------------------------------------------------------------------------------------------------------

export const shadTimePickerConfig = shadConfig({
  name: 'ShadTimePicker',
  displayName: 'Time picker',
  description: `shadcn/ui time picker: a field opening hour, minute (every minuteStep) and AM/PM columns, or (pickerStyle list) one list of times. Exposes value as 'HH:mm' in 24-hour time ('' when empty) and formattedValue as shown ('2:30 PM' or '14:30'); defaultValue, minTime and maxTime take '14:30' or '2:30 PM'. ${SIZING}`,
  defaultSize: { width: 10, height: 64 },
  properties: {
    ...fieldProperties('Time'),
    placeholder: code('Placeholder', STRING, 'Pick a time'),
    defaultValue: code('Default value (HH:mm)', STRING, ''),
    timeFormat: choice('Time format', ['12h', '24h'], '12h', { '12h': '12-hour', '24h': '24-hour' }),
    pickerStyle: choice('Picker', ['columns', 'list'], 'columns'),
    minuteStep: code('Minute step', NUMBER, 15),
    minTime: code('Earliest time (HH:mm)', STRING, ''),
    maxTime: code('Latest time (HH:mm)', STRING, ''),
  },
  defaults: {
    ...fieldDefaults('Time'),
    placeholder: { value: 'Pick a time' },
    defaultValue: { value: '' },
    timeFormat: { value: '12h' },
    pickerStyle: { value: 'columns' },
    minuteStep: { value: '{{15}}' },
    minTime: { value: '' },
    maxTime: { value: '' },
  },
  styles: { ...fieldStyles, iconColor: colorStyle('Clock icon color'), ...popoverStyles },
  validation: choiceValidation,
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { isValid: true, isMandatory: false, value: '', formattedValue: '' },
  actions: [valueAction('setTime', 'Set time', 'Time (HH:mm)'), CLEAR],
});

// ---- Date and time -------------------------------------------------------------------------------------------------

export const shadDateTimePickerConfig = shadConfig({
  name: 'ShadDateTimePicker',
  displayName: 'Date and time picker',
  description: `shadcn/ui date and time picker: a field opening a calendar with a time row (hour, minute every minuteStep, AM/PM). Exposes value as 'YYYY-MM-DDTHH:mm' (local time, '' when empty), selectedDate 'YYYY-MM-DD', selectedTime 'HH:mm', unixTimestamp (ms) and displayValue (dateFormat plus the time). defaultValue takes ISO text, 'YYYY-MM-DD HH:mm' or a unix timestamp; minDate/maxDate ('YYYY-MM-DD') and disabledDates (array) block days. ${SIZING}`,
  defaultSize: { width: 12, height: 64 },
  properties: {
    ...fieldProperties('Date and time'),
    placeholder: code('Placeholder', STRING, 'Pick a date and time'),
    defaultValue: code('Default value (YYYY-MM-DD HH:mm)', ANY_DATE, ''),
    dateFormat: code('Date display format', STRING, 'DD MMM YYYY', { placeholder: 'DD MMM YYYY, MM/DD/YYYY' }),
    timeFormat: choice('Time format', ['12h', '24h'], '12h', { '12h': '12-hour', '24h': '24-hour' }),
    minuteStep: code('Minute step', NUMBER, 5),
    minDate: code('Earliest date (YYYY-MM-DD)', STRING, ''),
    maxDate: code('Latest date (YYYY-MM-DD)', STRING, ''),
    disabledDates: code('Disabled dates', ARRAY, [], { placeholder: "['2026-12-25', '2027-01-01']" }),
  },
  defaults: {
    ...fieldDefaults('Date and time'),
    placeholder: { value: 'Pick a date and time' },
    defaultValue: { value: '' },
    dateFormat: { value: 'DD MMM YYYY' },
    timeFormat: { value: '12h' },
    minuteStep: { value: '{{5}}' },
    minDate: { value: '' },
    maxDate: { value: '' },
    disabledDates: { value: '{{[]}}' },
  },
  styles: { ...fieldStyles, iconColor: colorStyle('Calendar icon color'), ...popoverStyles },
  validation: choiceValidation,
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: {
    isValid: true,
    isMandatory: false,
    value: '',
    selectedDate: '',
    selectedTime: '',
    unixTimestamp: null,
    displayValue: '',
  },
  actions: [valueAction('setDate', 'Set date and time', 'Date and time (YYYY-MM-DD HH:mm)'), CLEAR],
});
