/**
 * DropdownV2: what it exposes, and its state actions (see ./index.js). Widgets/DropdownV2/DropdownV2.jsx uses these;
 * MultiselectV2 (./MultiselectV2.js) shares its options and actions.
 */
import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import { sortArray } from '@/AppBuilder/Widgets/DropdownV2/utils';

/** The options the widget offers: the schema's (advanced) or the manual ones, visible only, sorted by `sort`. */
export const selectOptionsOf = ({ advanced, schema, options, sort }) => {
  const source = advanced ? schema : options;
  if (!Array.isArray(source)) return [];
  const selectOptions = source
    .filter((data) => data?.visible ?? true)
    .map((data) => ({
      ...data,
      label: getSafeRenderableValue(data?.label),
      value: data?.value,
      caption: data?.caption ?? null,
      isDisabled: data?.disable ?? false,
    }));
  return sortArray(selectOptions, sort);
};

/** Options as they are exposed (`options`, `selectedOption(s)`). */
export const exposedOptionsOf = (options) =>
  options.map(({ label, value, caption }) => ({ label, value, caption: caption ?? null }));

/** The value selected by default: the first option marked visible and default (strictly true). */
export const defaultValueOf = ({ advanced, schema, options }) => {
  const source = advanced ? schema : options;
  return (Array.isArray(source) ? source : []).find((item) => item?.visible === true && item?.default === true)?.value;
};

/** The exposed `selectedOption` for `value`: its option among `selectOptions`, or null. */
export const selectedOptionOf = (selectOptions, value) => {
  const option = selectOptions.find((item) => item.value === value);
  return option ? { label: option.label, value: option.value, caption: option.caption ?? null } : null;
};

export const dropdownV2Exposure = {
  initial: ({ properties, validation, validate }) => {
    const selectOptions = selectOptionsOf(properties);
    const value = defaultValueOf(properties);
    return {
      options: exposedOptionsOf(selectOptions),
      value,
      selectedOption: selectedOptionOf(selectOptions, value),
      label: properties.label,
      searchText: '',
      isValid: validate(value).isValid,
      isVisible: properties.visibility,
      isLoading: properties.loadingState,
      isDisabled: properties.disabledState,
      isMandatory: validation?.mandatory ?? false,
    };
  },
  actions: {
    setVisibility: (current, [value]) => ({ isVisible: !!value }),
    setLoading: (current, [value]) => ({ isLoading: !!value }),
    setDisable: (current, [value]) => ({ isDisabled: !!value }),
  },
  // selectOption fires onSelect; both leave a selection only the drawn widget keeps (it resets it from its props).
  liveActions: ['selectOption', 'clear'],
  keepsRow: ['selectOption', 'clear'],
};
