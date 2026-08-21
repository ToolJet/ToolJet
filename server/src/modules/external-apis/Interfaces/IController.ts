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
  CreateAppV2Dto,
  RenameAppV2Dto,
  ListAppsV2QueryDto,
  ImportAppV2Dto,
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

export interface IExternalApisAppsControllerV2 {
  // Creates a new app in the given workspace
  createApp(workspaceIdentifier: string, dto: CreateAppV2Dto): Promise<any>;

  // Renames/updates an app's name, slug, or folder within the given workspace
  renameApp(workspaceIdentifier: string, appIdentifier: string, dto: RenameAppV2Dto): Promise<any>;

  // Lists apps in the given workspace, with search/folder filters and pagination
  listApps(workspaceIdentifier: string, query: ListAppsV2QueryDto): Promise<any>;

  // Retrieves a single app's curated details within the given workspace
  getApp(workspaceIdentifier: string, appIdentifier: string): Promise<any>;

  // Deletes an app within the given workspace
  deleteApp(workspaceIdentifier: string, appIdentifier: string): Promise<void>;

  // Imports an app into the given workspace from an exported definition
  importApp(workspaceIdentifier: string, dto: ImportAppV2Dto): Promise<any>;

  // Exports an app's definition from the given workspace
  exportApp(
    workspaceIdentifier: string,
    appIdentifier: string,
    exportTjdb?: boolean,
    appVersion?: string,
    exportAllVersions?: boolean
  ): Promise<any>;
}
