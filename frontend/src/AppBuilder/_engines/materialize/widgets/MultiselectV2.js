/**
 * MultiselectV2: what it exposes, and its state actions (see ./index.js). Widgets/MultiselectV2/MultiselectV2.jsx uses
 * these. Its options and state actions are DropdownV2's (./DropdownV2.js).
 */
import { dropdownV2Exposure, exposedOptionsOf, selectOptionsOf } from './DropdownV2';

/**
 * The options selected by default: the schema's items marked visible and default (advanced), else the options among
 * `selectOptions` whose value is in `values`.
 */
export const defaultSelectionOf = ({ advanced, schema, values }, selectOptions) => {
  if (advanced) return Array.isArray(schema) ? schema.filter((item) => item?.visible && item?.default) : [];
  // `values` carries no validation schema, so a broken binding can resolve to a string or an object: it selects
  // nothing, as a non-array `options` offers nothing. A Set, not a search of `values` per option: 10k options × 10k
  // values was 10^8 comparisons. As before, an option whose value is falsy isn't picked.
  const wanted = Array.isArray(values) ? new Set(values) : null;
  return wanted ? selectOptions.filter((item) => item.value && wanted.has(item.value)) : [];
};

export const multiselectV2Exposure = {
  initial: ({ properties, validation, validate }) => {
    const selectOptions = selectOptionsOf(properties);
    const selected = defaultSelectionOf(properties, selectOptions);
    const values = selected.map((option) => option.value);
    return {
      values,
      label: properties.label,
      isVisible: properties.visibility,
      isLoading: properties.loadingState,
      isDisabled: properties.disabledState,
      isMandatory: validation?.mandatory ?? false,
      isValid: validate(values.length ? values : null)?.isValid,
      selectedOptions: exposedOptionsOf(selected),
      options: exposedOptionsOf(selectOptions),
    };
  },
  actions: dropdownV2Exposure.actions,
  // selectOptions and deselectOptions change the selection, and clear empties it: a selection only the drawn widget
  // keeps (it resets it from its props).
  liveActions: ['selectOptions', 'deselectOptions', 'clear'],
  keepsRow: ['selectOptions', 'deselectOptions', 'clear'],
};
