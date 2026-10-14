const tinycolor = require('tinycolor2');

export const getTinyColorInstance = (value = '') => {
  const nextTinyColor = tinycolor(value);
  if (!nextTinyColor.isValid()) return undefined;
  return nextTinyColor;
};

export const getExposedColorState = (colorInstance, allowOpacity = true) => {
  if (!colorInstance) {
    return {
      selectedColorHex: undefined,
      selectedColorRGB: undefined,
      selectedColorRGBA: undefined,
    };
  }

  const { r, g, b, a } = colorInstance.toRgb();

  return {
    selectedColorHex: allowOpacity ? colorInstance.toHex8String() : colorInstance.toHexString(),
    selectedColorRGB: `rgb(${r}, ${g}, ${b})`,
    selectedColorRGBA: `rgba(${r}, ${g}, ${b}, ${a})`,
  };
};
