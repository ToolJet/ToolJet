/**
 * TextInput: what it exposes (see ./index.js). The widget (Widgets/TextInput.jsx, through
 * Widgets/BaseComponents/hooks/useInput.js) calls these, so a drawn and an undrawn row agree. useInput's other inputs
 * (PasswordInput, NumberInput …) run the same calls on mount.
 */

export const textInputExposure = {
  initial: ({ properties, validation, validate }) => {
    const value = properties.value ?? '';
    return {
      label: properties.label,
      isValid: validate(value).isValid,
      value,
      isMandatory: validation?.mandatory ?? false,
      isLoading: properties.loadingState,
      isVisible: properties.visibility,
      isDisabled: properties.disabledState || properties.loadingState,
    };
  },
  actions: {
    setVisibility: (current, [value]) => ({ isVisible: !!value }),
    visibility: (current, [value]) => ({ isVisible: !!value }),
    setDisable: (current, [value]) => ({ isDisabled: !!value }),
    disable: (current, [value]) => ({ isDisabled: !!value }),
    setLoading: (current, [value]) => ({ isLoading: !!value }),
  },
  // clear and setText fire onChange (setText also shows the validation error): the drawn widget runs them.
  liveActions: ['clear', 'setText', 'setFocus', 'setBlur'],
};
