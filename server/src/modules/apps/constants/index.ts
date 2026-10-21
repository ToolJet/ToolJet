export enum FEATURE_KEY {
  CREATE = 'APP_CREATE',
  UPDATE = 'APP_UPDATE',
  UPDATE_ICON = 'updateIcon',
  DELETE = 'APP_DELETE',
  GET = 'get',
  VALIDATE_PRIVATE_APP_ACCESS = 'validate_private_app_access',
  VALIDATE_RELEASED_APP_ACCESS = 'validate_released_app_access',
  GET_ASSOCIATED_TABLES = 'get_associated_tables',
  GET_ONE = 'get_one',
  GET_BY_SLUG = 'APP_VIEW',
  RELEASE = 'release',
  APP_PUBLIC_UPDATE = 'app_public_update',
  GET_APP_AUTHENTICATION_CONFIG = 'get_app_authentication_config',
  GET_RESTRICTED_ACCESS_INFO = 'get_restricted_access_info',
}

export enum APP_TYPES {
  FRONT_END = 'front-end',
  WORKFLOW = 'workflow',
  MODULE = 'module',
  QUERY_LIBRARY = 'query_library',
}

export const APPS_PAGE_SIZE = 9;

// Query libraries ride the Module permission bucket in Phase 1 (spec D9).
export const isModuleLikeAppType = (type?: string): boolean =>
  type === APP_TYPES.MODULE || type === APP_TYPES.QUERY_LIBRARY;

export enum LayoutDimensionUnits {
  COUNT = 'count',
  PERCENT = 'percent',
}
