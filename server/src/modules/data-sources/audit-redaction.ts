// Option keys holding OAuth token data, stored per user by upsertUserTokenData, never in data_source_options.
export const OAUTH_TOKEN_OPTION_KEYS = ['access_token', 'refresh_token', 'tokenData', 'token_data'];

const AUDIT_REDACTED_OPTION_KEYS = new Set([...OAUTH_TOKEN_OPTION_KEYS, 'code']);

// Audit metadata copy of data source options: encrypted and OAuth token values are replaced with null.
export function redactEncryptedOptions<T>(options: T): T {
  if (!Array.isArray(options)) return options;
  return options.map((option) =>
    option?.['encrypted'] === true ||
    option?.['encrypted'] === 'true' ||
    AUDIT_REDACTED_OPTION_KEYS.has(option?.['key'])
      ? { ...option, value: null }
      : option
  ) as T;
}
