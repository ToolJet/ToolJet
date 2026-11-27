// Key values that ship in public files (example env files, the old Helm chart, earlier preview and try images).
// Anyone can read them, so a production server must not sign or encrypt with them.
export const LEGACY_SAMPLE_LOCKBOX_KEY = 'replace_with_lockbox_master_key';

const SAMPLE_SECRET_VALUES = new Set([
  'replace_with_secret_key_base',
  LEGACY_SAMPLE_LOCKBOX_KEY,
  '0'.repeat(64),
  '0123456789ABCDEF',
]);

export function isSampleSecret(value: string | undefined): boolean {
  return !value || SAMPLE_SECRET_VALUES.has(value);
}

type SecretEnv = { NODE_ENV?: string; SECRET_KEY_BASE?: string; LOCKBOX_MASTER_KEY?: string };

// Only SECRET_KEY_BASE is fatal: replacing it just ends sessions. Replacing LOCKBOX_MASTER_KEY without
// `npm run rotate:keys:prod` would make stored credentials unreadable, so it only warns.
export function sampleSecretProblems(env: SecretEnv): { fatal?: string; warning?: string } {
  if (env.NODE_ENV !== 'production') return {};
  return {
    ...(isSampleSecret(env.SECRET_KEY_BASE) && {
      fatal:
        'SECRET_KEY_BASE is empty or a published example value. Set it to a random value (openssl rand -hex 64) and restart.',
    }),
    ...(isSampleSecret(env.LOCKBOX_MASTER_KEY) && {
      warning:
        'LOCKBOX_MASTER_KEY is empty or a published example value, so stored credentials are not protected. Rotate it with npm run rotate:keys:prod.',
    }),
  };
}
