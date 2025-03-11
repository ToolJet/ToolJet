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
}

export enum APP_TYPES {
  FRONT_END = 'front-end',
  WORKFLOW = 'workflow',
}

export enum LayoutDimensionUnits {
  COUNT = 'count',
  PERCENT = 'percent',
}
