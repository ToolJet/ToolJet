/**
 * Text: what it exposes (see ./index.js). The widget (Widgets/Text.jsx) calls these, so a drawn and an undrawn row
 * agree.
 */

/** The text shown and exposed for `properties.text`: 0 and false as strings, anything else as is. */
export const textOf = (properties) =>
  properties.text === 0 || properties.text === false ? properties.text?.toString() : properties.text;

export const textExposure = {
  initial: ({ properties }) => ({
    text: textOf(properties),
    isVisible: properties.visibility,
    isLoading: properties.loadingState,
    isDisabled: properties.disabledState,
  }),
  actions: {
    setText: (current, [text]) => ({ text }),
    clear: () => ({ text: '' }),
    visibility: (current, [value]) => ({ isVisible: !!value }),
    setVisibility: (current, [value]) => ({ isVisible: !!value }),
    setLoading: (current, [value]) => ({ isLoading: !!value }),
    setDisable: (current, [value]) => ({ isDisabled: !!value }),
  },
  liveActions: [],
};
