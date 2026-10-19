/**
 * RadioButtonV2: what it exposes, and its state actions (see ./index.js). Widgets/RadioButtonV2/RadioButtonV2.jsx uses
 * these.
 */
import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';

const optionSchemaOf = ({ advanced, schema, options }) => (advanced ? schema : options);

/** The options the widget draws: the visible ones (visible unless set otherwise), with a renderable label. */
export const selectOptionsOf = (properties) => {
  const options = optionSchemaOf(properties);
  if (!Array.isArray(options)) return [];
  return options
    .filter((data) => data?.visible ?? true)
    .map((data) => ({
      ...data,
      label: getSafeRenderableValue(data?.label),
      value: data?.value,
      isDisabled: data?.disable ?? false,
    }));
};

/** The value selected on mount: the first option marked default that is visible (strictly true for both). */
export const defaultValueOf = (properties) => {
  const options = optionSchemaOf(properties);
  if (!Array.isArray(options)) return undefined;
  return options.find((item) => item?.default === true && item?.visible === true)?.value;
};

export const radioButtonV2Exposure = {
  initial: ({ properties, validation, validate }) => {
    const value = defaultValueOf(properties);
    return {
      value,
      label: properties.label,
      options: selectOptionsOf(properties).map(({ label, value }) => ({ label, value })),
      isValid: validate(value).isValid,
      isMandatory: validation?.mandatory ?? false,
      isLoading: properties.loadingState,
      isVisible: properties.visibility,
      isDisabled: properties.disabledState,
    };
  },
  actions: {
    setVisibility: (current, [value]) => ({ isVisible: !!value }),
    setDisable: (current, [value]) => ({ isDisabled: !!value }),
    setLoading: (current, [value]) => ({ isLoading: !!value }),
  },
  // They fire onSelectionChange, and leave the selected value only the drawn widget keeps.
  liveActions: ['selectOption', 'deselectOption'],
  keepsRow: ['selectOption', 'deselectOption'],
};
