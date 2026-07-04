/**
 * The `useInput` hook that lived here is gone — the useInput widget family
 * (TextInput/Password/Email/TextArea/Number/Currency/Phone) is controlled via
 * `useControlledInput` (Phase 3a), with CSA semantics in `_engine/contracts.ts`.
 * Only the pure label-layout helpers below remain; many widgets import them.
 */

export const getWidthTypeOfComponentStyles = (widthType, labelWidth, labelAutoWidth, alignment) => {
  return {
    width: !labelAutoWidth && widthType === 'ofComponent' && alignment === 'side' ? `${100 - labelWidth}%` : '100%',
    minWidth: !labelAutoWidth && widthType === 'ofComponent' && alignment === 'side' ? `20%` : undefined,
  };
};

export const getLabelWidthOfInput = (widthType, labelWidth) => {
  if (widthType === 'ofComponent') return labelWidth;
  return (labelWidth / 100) * 70;
};

export const getLabelFontSize = (labelFontSize, defaultSize = 12) => {
  const size = Number(labelFontSize);
  return `${Number.isFinite(size) && size > 0 ? size : defaultSize}px`;
};

export const getLabelHeight = (labelFontSize, defaultSize = 12) => {
  const size = Number(labelFontSize);
  return (Number.isFinite(size) && size > 0 ? size : defaultSize) + 8;
};

export const checkIfInputWidgetTypeIsDeprecated = (optionValue) => {
  return optionValue === 'ofField';
};
