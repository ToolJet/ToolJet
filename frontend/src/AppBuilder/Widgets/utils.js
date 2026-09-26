// eslint-disable-next-line import/no-unresolved
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

export const getColorModeFromLuminance = (color, element = document.documentElement) => {
  // If color is a CSS variable, get its value
  const colorValue = color?.startsWith('var(') ? getCssVarValue(element, color) : color;
  // Use tinycolor to get the luminance
  const colorObj = tinycolor(colorValue);
  const luminance = colorObj.getLuminance();
  // Return 'dark' for light backgrounds and 'light' for dark backgrounds
  // Using 0.5 as the threshold (standard practice)
  return luminance > 0.5 ? 'dark' : 'light';
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
      : (defaultModificationAmountMappingByState[stateOrModificationAmount] ?? 0);

  const colorValue = color?.startsWith('var(') ? getCssVarValue(options?.element, color) : color;

  return tinycolor(colorValue).darken(modificationAmount).toString();
}

export function getSafeRenderableValue(value) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? value
    : (() => {
        try {
          return String(value ?? '');
        } catch {
          return '';
        }
      })();
}

export const getFormattedSteps = (steps) => {
  if (Array.isArray(steps)) return steps;
  if (typeof steps === 'string') {
    if (steps.trim() === '') return [];
    try {
      const parsed = JSON.parse(steps);
      return Array.isArray(parsed) ? steps : [];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Merge an author-supplied Plotly axis over the widget's own defaults.
 *
 * Spreading the author's axis blindly drops whatever we set under the same key —
 * notably `title`, where our font colour is lost the moment the author sets a
 * title at all. Merging `title` explicitly also normalises the two forms Plotly
 * 2.x accepted (a bare string, and a sibling `titlefont`) into the object form
 * Plotly 4 requires, so charts authored against 2.x keep their axis titles.
 */
export function buildChartAxis(userAxis, defaults = {}) {
  const { title, titlefont, ...rest } = userAxis ?? {};
  const titleText = typeof title === 'string' || typeof title === 'number' ? String(title) : title?.text;
  const axis = {
    ...defaults,
    ...rest,
    title: {
      ...(typeof title === 'object' ? title : {}),
      ...(titleText !== undefined && { text: titleText }),
      font: { ...defaults?.title?.font, ...titlefont, ...(typeof title === 'object' ? title?.font : undefined) },
    },
  };
  // Plotly 4 defaults an overlaying axis to tickmode:"sync", which replaces round
  // tick labels with raw values. Keep the 2.x default unless the author set one.
  if (axis.overlaying && axis.tickmode === undefined) axis.tickmode = 'auto';
  return axis;
}
