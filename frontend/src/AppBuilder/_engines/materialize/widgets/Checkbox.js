/** Checkbox: what it exposes, and its state actions (see ./index.js). Widgets/Checkbox/Checkbox.jsx uses these. */

export const checkboxExposure = {
  initial: ({ properties, validation, validate }) => {
    const value = properties.defaultValue ?? false;
    return {
      value,
      label: properties.label,
      isMandatory: validation?.mandatory ?? false,
      isLoading: properties.loadingState,
      isVisible: properties.visibility,
      // The widget starts disabled while loading too (disabledState || loadingState), and its disabledState effect
      // settles it to disabledState on mount: that is what the store holds once mounted.
      isDisabled: properties.disabledState,
      isValid: validate(value).isValid,
    };
  },
  actions: {
    setLoading: (current, [value]) => ({ isLoading: !!value }),
    setVisibility: (current, [value]) => ({ isVisible: !!value }),
    setDisable: (current, [value]) => ({ isDisabled: !!value }),
  },
  // They fire onChange / onCheck / onUnCheck, and leave the checked state only the drawn widget keeps.
  liveActions: ['toggle', 'setValue', 'setChecked'],
  keepsRow: ['toggle', 'setValue', 'setChecked'],
};
