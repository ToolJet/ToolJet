import {
  UpdateUserDto,
  WorkspaceDto,
  UpdateGivenWorkspaceDto,
  CreateUserDto,
  AppGitPullDto,
  AppGitPushDto,
  AppImportRequestDto,
  AutoDeployBodyDto,
  SaveVersionBodyDto,
  UpdateUserV2Dto,
  ListUsersV2QueryDto,
  ListUserWorkspacesV2QueryDto,
  CreateWorkspaceV2Dto,
  UpdateWorkspaceV2Dto,
  ListWorkspacesV2QueryDto,
  CreateWorkspaceUserV2Dto,
  UpdateWorkspaceUserV2Dto,
  BulkUpdateWorkspaceUsersV2Dto,
  ListWorkspaceUsersV2QueryDto,
  ListWorkspaceUserGroupsV2QueryDto,
} from '../dto';
import { EditUserRoleDto } from '@modules/roles/dto';

export interface IExternalApisController {
  // Gets list of all users in the system
  getAllUsers(groupNamesString?: string): Promise<any>;

  // Retrieves a single user by ID
  getUser(id: string): Promise<any>;

  // Creates a new user with provided data
  createUser(createUser: CreateUserDto): Promise<any>;

  // Updates existing user information
  updateUser(id: string, updateUserDto: UpdateUserDto): Promise<void>;

  // Replaces all workspaces for a user
  replaceUserWorkspaces(id: string, workspaces: WorkspaceDto[]): Promise<void>;

  // Updates a specific workspace for a user
  updateUserWorkspace(id: string, workspaceId: string, workspace: UpdateGivenWorkspaceDto): Promise<void>;

  // Gets list of all workspaces
  getAllWorkspaces(): Promise<any>;

  // Updates user role
  updateUserRole(workspaceId: string, editRoleDto: EditUserRoleDto): Promise<any>;
}

export interface IExternalApisAppsController {
  pullNewAppFromGit(createMode: string, payload: AppGitPullDto): Promise<any>;

  pullChangesIntoExistingApp(appId: string, createMode: string): Promise<any>;

  pushVersionToGit(appId: string, versionId: string, payload: AppGitPushDto): Promise<any>;

  autoDeployApp(appIdOrSlug: string, body: AutoDeployBodyDto): Promise<any>;

  saveAppVersion(appIdOrSlug: string, body: SaveVersionBodyDto): Promise<any>;

  getAllWorkspaceApps(workspaceId: string): Promise<any>;

  importApp(workspaceId: string, importresources: AppImportRequestDto): Promise<{ message: string }>;

  exportApp(
    appId: string,
    workspaceId: string,
    exportTjdb: boolean,
    appVersion: string,
    exportAllVersions: boolean
  ): Promise<any>;
}

export interface IExternalApisUsersControllerV2 {
  listUsers(query: ListUsersV2QueryDto): Promise<any>;

  getUser(userIdentifier: string): Promise<any>;

  updateUser(userIdentifier: string, dto: UpdateUserV2Dto): Promise<any>;

  archiveUser(userIdentifier: string): Promise<any>;

  unarchiveUser(userIdentifier: string): Promise<any>;

  listUserWorkspaces(userIdentifier: string, query: ListUserWorkspacesV2QueryDto): Promise<any>;
}

export interface IExternalApisWorkspacesControllerV2 {
  createWorkspace(dto: CreateWorkspaceV2Dto): Promise<any>;

  listWorkspaces(query: ListWorkspacesV2QueryDto): Promise<any>;

  getWorkspace(workspaceIdentifier: string): Promise<any>;

  updateWorkspace(workspaceIdentifier: string, dto: UpdateWorkspaceV2Dto): Promise<any>;

  archiveWorkspace(workspaceIdentifier: string): Promise<any>;

  unarchiveWorkspace(workspaceIdentifier: string): Promise<any>;

  setDefaultWorkspace(workspaceIdentifier: string): Promise<any>;
}

export interface IExternalApisWorkspaceUsersControllerV2 {
  createWorkspaceUser(workspaceIdentifier: string, dto: CreateWorkspaceUserV2Dto): Promise<any>;

  // body is untyped: this route accepts EITHER a JSON { users: [...] } payload OR a multipart CSV file,
  // so it can't go through the global ValidationPipe — entries are validated individually in the service layer.
  bulkCreateWorkspaceUsers(workspaceIdentifier: string, body: any, file?: any): Promise<any>;

  listWorkspaceUsers(workspaceIdentifier: string, query: ListWorkspaceUsersV2QueryDto): Promise<any>;

  getWorkspaceUser(workspaceIdentifier: string, userIdentifier: string): Promise<any>;

  updateWorkspaceUser(workspaceIdentifier: string, userIdentifier: string, dto: UpdateWorkspaceUserV2Dto): Promise<any>;

  bulkUpdateWorkspaceUsers(workspaceIdentifier: string, dto: BulkUpdateWorkspaceUsersV2Dto): Promise<any>;

  archiveWorkspaceUser(workspaceIdentifier: string, userIdentifier: string): Promise<any>;

  unarchiveWorkspaceUser(workspaceIdentifier: string, userIdentifier: string): Promise<any>;

  listWorkspaceUserGroups(
    workspaceIdentifier: string,
    userIdentifier: string,
    query: ListWorkspaceUserGroupsV2QueryDto
  ): Promise<any>;
}
