/** ToggleSwitchV2: what it exposes, and its state actions (see ./index.js). Widgets/ToggleV2.jsx uses these. */

export const toggleSwitchV2Exposure = {
  initial: ({ properties, validation, validate }) => {
    const value = properties.defaultValue ?? false;
    return {
      label: properties.label,
      isMandatory: validation?.mandatory ?? false,
      isLoading: properties.loadingState,
      isVisible: properties.visibility,
      // The widget starts disabled while loading too (disabledState || loadingState), and its disabledState effect
      // settles it to disabledState on mount: that is what the store holds once mounted.
      isDisabled: properties.disabledState,
      isValid: validate(Boolean(value)).isValid,
      // Exposed as resolved; the switch shows, and validates, it as a boolean.
      value,
    };
  },
  actions: {
    setLoading: (current, [value]) => ({ isLoading: !!value }),
    setVisibility: (current, [value]) => ({ isVisible: !!value }),
    setDisable: (current, [value]) => ({ isDisabled: !!value }),
  },
  // toggle fires onChange; setValue shows the validation error. Both leave the switch's state only the drawn widget
  // keeps.
  liveActions: ['toggle', 'setValue'],
  keepsRow: ['toggle', 'setValue'],
};
