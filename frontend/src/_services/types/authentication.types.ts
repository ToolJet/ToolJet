// Mirrors the decamelized payloads of GET /authorize (server AuthService.authorizeOrganization) and the
// login/session responses (SessionUtilService.generateSessionPayload), merged in by updateCurrentSession.

export interface SessionUserPermissions {
  is_admin: boolean;
  is_super_admin: boolean;
  is_builder: boolean;
  is_end_user: boolean;
  app_create: boolean;
  app_delete: boolean;
  app_promote: boolean;
  app_release: boolean;
  workflow_create: boolean;
  workflow_delete: boolean;
  module_create?: boolean;
  module_delete?: boolean;
  data_source_create: boolean;
  data_source_delete: boolean;
  folder_create: boolean;
  folder_delete: boolean;
  workflow_folder_create: boolean;
  workflow_folder_delete: boolean;
  module_folder_create?: boolean;
  module_folder_delete?: boolean;
  data_source_folder_create?: boolean;
  data_source_folder_delete?: boolean;
  // humps decamelizes the server's `orgConstantCRUD` letter by letter.
  org_constant_c_r_u_d: boolean;
  tjdb_c_r_u_d: boolean;
  org_variable_c_r_u_d: boolean;
}

export interface EnvironmentPermissionSet {
  development: boolean;
  staging: boolean;
  production: boolean;
  released: boolean;
}

export interface SessionAppPermissions {
  editable_apps_id: string[];
  is_all_editable: boolean;
  viewable_apps_id: string[];
  is_all_viewable: boolean;
  hidden_apps_id: string[];
  hide_all: boolean;
  owned_apps_id: string[];
  environment_access?: EnvironmentPermissionSet;
  app_specific_environment_access?: Record<string, EnvironmentPermissionSet>;
}

export interface SessionDataSourcePermissions {
  usable_data_sources_id: string[];
  is_all_usable: boolean;
  configurable_data_source_id: string[];
  is_all_configurable: boolean;
}

export interface SessionWorkflowPermissions {
  editable_workflows_id: string[];
  is_all_editable: boolean;
  executable_workflows_id: string[];
  is_all_executable: boolean;
}

export interface SessionFolderPermissions {
  editable_folders_id: string[];
  is_all_editable: boolean;
  viewable_folders_id: string[];
  is_all_viewable: boolean;
  edit_apps_in_folders_id: string[];
  is_all_edit_apps: boolean;
}

export interface SessionGroup {
  id: string;
  organization_id: string;
  name: string;
  type: 'default' | 'custom';
}

export interface SessionCurrentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_id?: string | null;
  ai_build_notifications_enabled?: boolean;
  sso_user_info?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at?: string;
  organization_id?: string;
}

export interface CurrentSession {
  current_organization_id: string | null;
  current_organization_name: string | null;
  current_organization_slug?: string | null;
  current_user?: SessionCurrentUser;
  super_admin: boolean | null;
  admin: boolean | null;
  role: SessionGroup | null;
  user_permissions: SessionUserPermissions | null;
  group_permissions: SessionGroup[] | null;
  app_group_permissions: SessionAppPermissions | null;
  data_source_group_permissions: SessionDataSourcePermissions | null;
  workflow_group_permissions: SessionWorkflowPermissions | null;
  folder_group_permissions: SessionFolderPermissions | null;
  workflow_folder_group_permissions: SessionFolderPermissions | null;
  module_folder_group_permissions: SessionFolderPermissions | null;
  data_source_folder_group_permissions: SessionFolderPermissions | null;
  organizations: unknown[];
  isUserLoggingIn: boolean;
  authentication_status: boolean | null;
  authentication_failed: boolean | null;
  isOrgSwitchingFailed: boolean | null;
  isUserUpdated: boolean;
  // Only used in the viewer.
  load_app: boolean;
  instance_id: string | null;
  noWorkspaceAttachedInTheSession: boolean;
  triggeredOnce: boolean | null;
  createdAt: string | null;
  isCurrentOrganizationArchived?: boolean;
  isInviteFlw?: boolean;
  ai_cookies?: Record<string, string>;
  // Server field name is misspelled ("consulation").
  consulation_banner_date?: string;
  tj_api_source?: string;
  tj_template_id?: string;
}
