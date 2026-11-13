import { getTooljetEdition } from '@helpers/utils.helper';

export enum FEATURE_KEY {
  GET_SOURCE = 'GET_SOURCE',
  WRITE_SOURCE = 'WRITE_SOURCE',
  IMPORT_SOURCE = 'IMPORT_SOURCE',
  UPLOAD_DEV_BUNDLE = 'UPLOAD_DEV_BUNDLE',
  LIST_REVISIONS = 'LIST_REVISIONS',
  PUBLISH_CODE = 'PUBLISH_CODE',
  DOWNLOAD_CLI = 'DOWNLOAD_CLI',
}

/** Injection token: the running edition's library service, as the dev track uploader. */
export const DEV_TRACK_UPLOADER = 'CODE_MODE_DEV_TRACK_UPLOADER';

/** Injection token: the running edition's workspace settings service, for the edit rules. */
export const GIT_SYNC_DETAILS = 'CODE_MODE_GIT_SYNC_DETAILS';

/** Whether this server can build apps with buildMode 'code' (the enterprise editions; the one switch for it). */
export const isCodeModeAllowed = (_organizationId?: string): boolean => getTooljetEdition() !== 'ce';
