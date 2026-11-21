import { choiceKey, type ChoiceOption } from './options';

// What a single choice hands the host's Validation section. The host judges a present value with the same mandatory
// check as a native input (!value, with 0 allowed), so a picked option valued false, or '' (an "All" choice), reads as
// empty: a required Select showed False value selected and refused the Form (SP-08, 2026-10-23). UI 2.0 normalised a
// present value before validating (validationInput); the choice section only checks mandatory and a custom rule, which
// reads the app's state rather than this value, so the option's key stands in for those two values. The exposed value
// keeps its type. The host should honour `present` for every falsy value itself (usePackHost useHostValidation); until
// it does, this keeps the choice fields right.
export const choiceValidationValue = (selected: ChoiceOption | undefined): unknown => {
  if (!selected) return '';
  return selected.value === false || selected.value === '' ? choiceKey(selected.value) : selected.value;
};
