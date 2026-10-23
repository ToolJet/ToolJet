/** Image: what it exposes, and its state actions (see ./index.js). Image.jsx uses these. */

/** The URL the image shows: the source URL, or a data URL built from the JS object. */
export const imageURLOf = ({ imageFormat, source, jsSchema }) =>
  imageFormat === 'imageUrl' ? source : `data:${jsSchema?.type};base64,${jsSchema?.base64Data}`;

export const imageExposure = {
  initial: ({ properties }) => ({
    imageURL: imageURLOf(properties),
    alternativeText: properties.alternativeText,
    isLoading: properties.loadingState,
    isVisible: properties.visibility,
    isDisabled: properties.disabledState,
  }),
  actions: {
    setImageURL: (current, [value]) => ({ imageURL: value }),
    clearImage: () => ({ imageURL: '' }),
    setVisibility: (current, [value]) => ({ isVisible: !!value }),
    setLoading: (current, [value]) => ({ isLoading: !!value }),
    setDisable: (current, [value]) => ({ isDisabled: !!value }),
  },
  liveActions: [],
};
