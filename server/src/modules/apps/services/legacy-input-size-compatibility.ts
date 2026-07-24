export const LEGACY_INPUT_SIZE_COMPONENT_TYPES = new Set([
  'TextInput',
  'PasswordInput',
  'EmailInput',
  'PhoneInput',
  'CurrencyInput',
  'NumberInput',
  'Cascader',
  'TextArea',
]);

export const LEGACY_INPUT_SIZE_PROPERTY = 'legacyInputSize';
const LEGACY_INPUT_SIZE_ENABLED = { value: '{{true}}' };

export function addLegacyInputSizeToExistingComponent<T extends Record<string, unknown>>(
  componentType: string,
  properties: T | null | undefined = {} as T
): T {
  const existingProperties = properties ?? ({} as T);

  if (!LEGACY_INPUT_SIZE_COMPONENT_TYPES.has(componentType)) {
    return existingProperties;
  }

  if (existingProperties[LEGACY_INPUT_SIZE_PROPERTY] !== undefined) {
    return existingProperties;
  }

  return {
    ...existingProperties,
    [LEGACY_INPUT_SIZE_PROPERTY]: { ...LEGACY_INPUT_SIZE_ENABLED },
  } as T;
}
