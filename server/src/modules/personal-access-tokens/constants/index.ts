export enum FEATURE_KEY {
  CREATE_PAT = 'CREATE_PAT',
  LIST_PATS = 'LIST_PATS',
  DELETE_PAT = 'DELETE_PAT',
  VALIDATE_PAT = 'VALIDATE_PAT',
  CREATE_PAT_SESSION = 'CREATE_PAT_SESSION',
}

export const PAT_TOKEN_PREFIX = 'tj_pat_';

// Stamped onto the minted session's JWT (tj_api_source) so PAT-driven writes are
// distinguishable from a human's in audit logs.
export const PAT_API_SOURCE = 'personal_access_token';

// The AI builder's agent also authenticates through the PAT exchange; its sessions carry
// this source instead, so app validation treats AI builds as 'ai' (report), not the
// enforced 'pat' (see app-validation/core/mode.ts resolveSource).
export const AI_BUILDER_API_SOURCE = 'ai_builder';
