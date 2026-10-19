/**
 * NumberInput: what it exposes (see ./index.js). The widget (Widgets/NumberInput.jsx, through
 * Widgets/BaseComponents/hooks/useInput.js) calls these, so a drawn and an undrawn row agree.
 */
import { textInputExposure } from './TextInput';

/** The number the input holds for `value`: rounded to `decimalPlaces`; an empty value ('', null, undefined) as is. */
export const numberOf = (value, decimalPlaces) =>
  value === '' || value === null || value === undefined ? value : Number(parseFloat(value).toFixed(decimalPlaces));

/** An empty field, or one that holds no number: it exposes null as its value. */
export const isEmptyNumber = (value) => isNaN(value) || value === '';

const { setVisibility, setDisable, setLoading } = textInputExposure.actions;

export const numberInputExposure = {
  // TextInput's, over the rounded value; an empty field or one not a number exposes null.
  initial: (input) => {
    const { properties } = input;
    const exposed = textInputExposure.initial({
      ...input,
      properties: { ...properties, value: numberOf(properties.value, properties.decimalPlaces) },
    });
    return { ...exposed, value: isEmptyNumber(exposed.value) ? null : exposed.value };
  },
  actions: { setVisibility, setDisable, setLoading },
  // clear and setText fire onChange (setText also shows the validation error): the drawn widget runs them.
  liveActions: ['clear', 'setText', 'setFocus', 'setBlur'],
  // What they leave (the value typed, focus) only the drawn widget keeps.
  keepsRow: ['clear', 'setText', 'setFocus'],
};
