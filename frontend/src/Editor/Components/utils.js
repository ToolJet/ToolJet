import tinycolor from 'tinycolor2';

function extractCssVarName(cssVarExpression) {
  // Ex: var(--cc-primary-brand) -> --primary-brand
  const match = cssVarExpression.match(/var\(\s*(--[^,\s)]+)\s*(?:,[^)]+)?\)/);
  return match ? match[1] : null;
}

export const getCssVarValue = (element, cssVarExpression) => {
  if (!element) return null;

  const cssVariableName = extractCssVarName(cssVarExpression);
  const cssVariableValue = element.style?.getPropertyValue(cssVariableName)?.trim();

  return cssVariableValue ?? null;
};

const defaultModificationAmountMappingByState = {
  hover: 8,
  active: 15,
};

export function getModifiedColor(color, stateOrModificationAmount, options = { element: document.documentElement }) {
  // color: Can be value directly like #000000 or rgb or hsl or var(--cc-primary-brand)
  // stateOrModificationAmount: Any value from defaultModificationAmountMappingByState or a number between 0 to 100 (defaultValue 0)
  // options: For now you can pass the element from which you will grab the CSS Variable Expression Value, you can extend as per need

  const modificationAmount =
    typeof stateOrModificationAmount === 'number'
      ? stateOrModificationAmount
      : defaultModificationAmountMappingByState[stateOrModificationAmount] ?? 0;

  const colorValue = color?.startsWith('var(') ? getCssVarValue(options?.element, color) : color;

  return tinycolor(colorValue).darken(modificationAmount).toString();
}
