export const RESERVED_PARAMS = new Set([
  'moment',
  '_',
  'components',
  'queries',
  'globals',
  'page',
  'axios',
  'variables',
  'actions',
  'constants',
  'parameters',
  'input',
  'data',
  'module',
  'exports',
  'define',
  'self',
  'window',
  'output',
]);

export const VALID_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

export function validateLibraryName(name) {
  if (!VALID_IDENTIFIER.test(name)) return 'Name must be a valid JavaScript identifier';
  if (RESERVED_PARAMS.has(name)) return `"${name}" is reserved and cannot be used`;
  return null;
}
