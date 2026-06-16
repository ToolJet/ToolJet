/**
 * Build-time edition constants.
 *
 * `process.env.TOOLJET_EDITION` is replaced with a string literal by webpack's
 * DefinePlugin (webpack.config.js), so every branch on these values is
 * dead-code-eliminated in production builds.
 *
 * For module/component selection (where an import must be tree-shaken away),
 * use the inline literal `process.env.TOOLJET_EDITION === 'ce'` directly next
 * to the import reference. Use these constants for ordinary feature gating.
 */
export const EDITION = (process.env.TOOLJET_EDITION || 'ce').toLowerCase(); // 'ce' | 'ee' | 'cloud'
export const IS_CE = EDITION === 'ce';
export const IS_CLOUD = EDITION === 'cloud';
// Cloud runs the EE build; treat it as EE for feature availability.
export const IS_EE_LIKE = EDITION === 'ee' || EDITION === 'cloud';
