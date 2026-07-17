export const MAX_AVATAR_FILE_SIZE = 1024 * 1024 * 2; // 2MB

export enum FEATURE_KEY {
  GET = 'get',
  UPDATE = 'update',
  UPDATE_AVATAR = 'update_avatar',
  UPDATE_PASSWORD = 'update_password',
  MFA_SETUP = 'mfa_setup',
  MFA_CONFIRM = 'mfa_confirm',
  MFA_DISABLE = 'mfa_disable',
}
