export enum PAGE_PERMISSION_TYPE {
  SINGLE = 'SINGLE',
  GROUP = 'GROUP',
  ALL = 'ALL',
}

export enum PERMISSION_ENTITY_TYPE {
  PAGE = 'PAGE',
  QUERY = 'QUERY',
  COMPONENT = 'COMPONENT',
}

export enum FEATURE_KEY {
  FETCH_USERS = 'fetch_users',
  FETCH_USER_GROUPS = 'fetch_user_groups',
  FETCH_PAGE_PERMISSIONS = 'fetch_page_permissions',
  CREATE_PAGE_PERMISSIONS = 'create_page_permissions',
  UPDATE_PAGE_PERMISSIONS = 'update_page_permissions',
  DELETE_PAGE_PERMISSIONS = 'delete_page_permissions',
  FETCH_QUERY_PERMISSIONS = 'fetch_query_permissions',
  CREATE_QUERY_PERMISSIONS = 'create_query_permissions',
  UPDATE_QUERY_PERMISSIONS = 'update_query_permissions',
  DELETE_QUERY_PERMISSIONS = 'delete_query_permissions',
  FETCH_COMPONENT_PERMISSIONS = 'fetch_component_permissions',
  CREATE_COMPONENT_PERMISSIONS = 'create_component_permissions',
  UPDATE_COMPONENT_PERMISSIONS = 'update_component_permissions',
  DELETE_COMPONENT_PERMISSIONS = 'delete_component_permissions',
}
