// Preserve the Modules name rule; punctuation such as dots, slashes and plus signs is valid.
export const VERSION_NAME_FORBIDDEN = 'Version name cannot contain spaces or special characters (~ ^ : ? * [ \\ @ {).';
export function validateVersionName(value) {
  if (value.trim() === '') return 'Version name should not be empty';
  if (value.length > 25) return 'Version name cannot exceed 25 characters';
  if (/[\s~^:?*[\]\\@{]/.test(value.trim())) return VERSION_NAME_FORBIDDEN;
  return '';
}

export function validateVersionDescription(value) {
  return value.length > 500 ? 'Description cannot exceed 500 characters' : '';
}
