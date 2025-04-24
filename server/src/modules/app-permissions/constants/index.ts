export enum PAGE_PERMISSION_TYPE {
  SINGLE = 'SINGLE',
  GROUP = 'GROUP',
  ALL = 'ALL',
}

export enum FEATURE_KEY {
  FETCH_USERS = 'fetch_users',
  FETCH_USER_GROUPS = 'fetch_user_groups',
  FETCH_PAGE_PERMISSIONS = 'fetch_page_permissions',
  CREATE_PAGE_PERMISSIONS = 'create_page_permissions',
  UPDATE_PAGE_PERMISSIONS = 'update_page_permissions',
  DELETE_PAGE_PERMISSIONS = 'delete_page_permissions',
}
