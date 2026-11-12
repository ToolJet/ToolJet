export enum FEATURE_KEY {
  GET = 'get',
  UPDATE = 'update',
}

// Rows in the instance_settings table owned by this module (seeded by AddSsrfProtectionInstanceSettings).
export enum SSRF_SETTINGS {
  PROTECTION_ENABLED = 'SSRF_PROTECTION_ENABLED',
  ALLOWED_ADDRESSES = 'SSRF_ALLOWED_ADDRESSES',
  UPGRADE_NOTICE_DISMISSED = 'SSRF_UPGRADE_NOTICE_DISMISSED',
}

export const SSRF_ALLOWLIST_MAX_ENTRIES = 200;
