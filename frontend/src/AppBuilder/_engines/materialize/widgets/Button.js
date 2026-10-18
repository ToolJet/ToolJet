/** Button: what it exposes, and its state actions (see ./index.js). Widgets/Button.jsx uses these. */

const isLoading = (current, [value]) => ({ isLoading: !!value });
const isVisible = (current, [value]) => ({ isVisible: !!value });
const isDisabled = (current, [value]) => ({ isDisabled: !!value });

export const buttonExposure = {
  initial: ({ properties }) => ({
    // Only a string label is exposed; otherwise buttonText is left unset.
    ...(typeof properties.text === 'string' && { buttonText: properties.text }),
    isLoading: properties.loadingState,
    isVisible: properties.visibility,
    // The widget starts disabled while loading too (disabledState || loadingState), and its disabledState effect
    // settles it to disabledState on mount: that is what the store holds once mounted.
    isDisabled: properties.disabledState,
  }),
  actions: {
    setText: (current, [text]) => ({ buttonText: text }),
    setLoading: isLoading,
    setVisibility: isVisible,
    setDisable: isDisabled,
    // Deprecated: they set the widget's state, which its effects expose.
    loading: isLoading,
    visibility: isVisible,
    disable: isDisabled,
  },
  liveActions: ['click'],
};
