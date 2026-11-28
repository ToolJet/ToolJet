export const FALLBACK_ERROR = 'Something went wrong. Please try again.';

// Figma: a masked secret is 21 asterisks, in the table and as the edit modal's placeholder.
export const SECRET_MASK = '*'.repeat(21);

// Shown on whatever is disabled because the constant comes from an environment variable.
export const ENV_CONSTANT_TOOLTIP = 'Constants created from environment variables cannot be edited or deleted';
// Design: the text wraps at 120px (12px padding each side) and is centred, with 10px corners.
export const ENV_CONSTANT_TOOLTIP_CLASSES: { content: string } = {
  content: 'tw-max-w-[144px] tw-rounded-large tw-text-center',
};

// Shown when a Secret's value cell is hovered: its value is never sent to the browser.
export const SECRET_VALUE_TOOLTIP = 'Fetched at runtime';
