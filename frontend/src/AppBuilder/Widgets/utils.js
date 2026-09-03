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
      : defaultModificationAmountMappingByState[stateOrModificationAmount] ?? 0;

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

export const DEFAULT_TIMER_FORMAT = 'hh:mm:ss:SSS';

export function padTimeUnit(value, digits = 2) {
  const numeric = Number(value);
  return String(Number.isFinite(numeric) ? numeric : 0).padStart(digits, '0');
}

/**
 * Formats a timer's {hour, minute, second, mSecond} into a display string using
 * a token-based format. Supported tokens: hh/HH (hours), mm/MM (minutes),
 * ss/SS (seconds) padded to 2 digits, and SSS (milliseconds) padded to 3.
 * SSS is matched before SS so milliseconds never collide with seconds.
 * Falsy/blank formats fall back to DEFAULT_TIMER_FORMAT.
 */
export function formatTimerValue(time = {}, format = DEFAULT_TIMER_FORMAT) {
  const safeFormat = format || DEFAULT_TIMER_FORMAT;
  const tokens = {
    HH: padTimeUnit(time.hour, 2),
    hh: padTimeUnit(time.hour, 2),
    MM: padTimeUnit(time.minute, 2),
    mm: padTimeUnit(time.minute, 2),
    SSS: padTimeUnit(time.mSecond, 3),
    SS: padTimeUnit(time.second, 2),
    ss: padTimeUnit(time.second, 2),
  };
  return safeFormat.replace(/SSS|hh|HH|mm|MM|ss|SS/g, (match) => tokens[match]);
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
