/** Per-app scan features (module MODULES.APP_SECURITY): routes under /apps/:id/versions/:versionId. */
export enum FEATURE_KEY {
  GET_SCANS = 'GET_SCANS',
  RUN_SCAN = 'RUN_SCAN',
  PUBLISH_SCAN = 'PUBLISH_SCAN',
  UPLOAD_SCAN_RESULTS = 'UPLOAD_SCAN_RESULTS',
  OVERRIDE_GATE = 'OVERRIDE_GATE',
}

/** Workspace features (module MODULES.APP_SECURITY_POLICY): policy, exceptions and the Security Center. */
export enum POLICY_FEATURE_KEY {
  GET_POLICY = 'GET_SCAN_POLICY',
  UPDATE_POLICY = 'UPDATE_SCAN_POLICY',
  LIST_EXCEPTIONS = 'LIST_SCAN_EXCEPTIONS',
  CREATE_EXCEPTION = 'CREATE_SCAN_EXCEPTION',
  REVOKE_EXCEPTION = 'REVOKE_SCAN_EXCEPTION',
  SECURITY_CENTER = 'GET_SECURITY_CENTER',
  RECHECK = 'RECHECK_RELEASED_VERSIONS',
}

/** Upper bounds on what an upload may carry, so one request cannot fill the database. */
export const MAX_FINDINGS_PER_SCAN = 5000;
export const MAX_DEPENDENCIES_PER_SCAN = 20000;
export const MAX_SARIF_BYTES = 20 * 1024 * 1024;
