// Normal Jest owns execution; AI checks must accept its unit/e2e directory layout
// and cross-module regressions that exercise AI behavior.
const testKind = (pkg, file) => {
  if (pkg === 'frontend') return /\/__tests__\/.*\.spec\.[jt]sx?$/.test(file) ? 'unit' : null;
  return /^server\/(?:ee\/)?test\/modules\/.+\/(unit|e2e)\/.+\.spec\.ts$/.exec(file)?.[1] || null;
};
const isFocusedTest = (pkg, file) =>
  pkg === 'frontend' || /^server\/(?:ee\/)?test\/modules\/ai\/unit\/.+\.spec\.ts$/.test(file);
const hasDisabledTest = (source) => /\b(?:it|test|describe)\s*\.\s*(?:only|skip|todo)\s*(?:\(|\.)/.test(source);
module.exports = { testKind, isFocusedTest, hasDisabledTest };
