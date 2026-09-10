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
  CreateModuleV2Dto,
  RenameModuleV2Dto,
  ListModulesV2QueryDto,
  ImportModuleV2Dto,
  CreateWorkflowV2Dto,
  RenameWorkflowV2Dto,
  ListWorkflowsV2QueryDto,
  ImportWorkflowV2Dto,
  CreateFolderV2Dto,
  UpdateFolderV2Dto,
  ListFoldersV2QueryDto,
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

export interface IExternalApisModulesControllerV2 {
  // Creates a new module in the given workspace
  createModule(workspaceIdentifier: string, dto: CreateModuleV2Dto): Promise<any>;

  // Renames a module's name within the given workspace
  renameModule(workspaceIdentifier: string, moduleIdentifier: string, dto: RenameModuleV2Dto): Promise<any>;

  // Lists modules in the given workspace, with search and pagination
  listModules(workspaceIdentifier: string, query: ListModulesV2QueryDto): Promise<any>;

  // Retrieves a single module's curated details within the given workspace
  getModule(workspaceIdentifier: string, moduleIdentifier: string): Promise<any>;

  // Deletes a module within the given workspace
  deleteModule(workspaceIdentifier: string, moduleIdentifier: string): Promise<void>;

  // Imports a module into the given workspace from an exported definition
  importModule(workspaceIdentifier: string, dto: ImportModuleV2Dto): Promise<any>;

  // Exports a module's definition from the given workspace
  exportModule(workspaceIdentifier: string, moduleIdentifier: string, exportTjdb?: boolean): Promise<any>;
}

export interface IExternalApisWorkflowsControllerV2 {
  // Creates a new workflow in the given workspace
  createWorkflow(workspaceIdentifier: string, dto: CreateWorkflowV2Dto): Promise<any>;

  // Renames/updates a workflow's name or folder within the given workspace
  renameWorkflow(workspaceIdentifier: string, workflowIdentifier: string, dto: RenameWorkflowV2Dto): Promise<any>;

  // Lists workflows in the given workspace, with search/folder filters and pagination
  listWorkflows(workspaceIdentifier: string, query: ListWorkflowsV2QueryDto): Promise<any>;

  // Retrieves a single workflow's curated details within the given workspace
  getWorkflow(workspaceIdentifier: string, workflowIdentifier: string): Promise<any>;

  // Deletes a workflow within the given workspace
  deleteWorkflow(workspaceIdentifier: string, workflowIdentifier: string): Promise<void>;

  // Imports a workflow into the given workspace from an exported definition
  importWorkflow(workspaceIdentifier: string, dto: ImportWorkflowV2Dto): Promise<any>;

  // Exports a workflow's definition from the given workspace
  exportWorkflow(
    workspaceIdentifier: string,
    workflowIdentifier: string,
    exportTjdb?: boolean,
    appVersion?: string,
    exportAllVersions?: boolean
  ): Promise<any>;
}

// Shared by the App/Module/Workflow Folders controllers — identical shape for all three,
// the resource type is fixed per-controller rather than passed by the caller.
export interface IExternalApisFoldersControllerV2 {
  createFolder(workspaceIdentifier: string, dto: CreateFolderV2Dto): Promise<any>;

  listFolders(workspaceIdentifier: string, query: ListFoldersV2QueryDto): Promise<any>;

  getFolder(workspaceIdentifier: string, folderIdentifier: string): Promise<any>;

  updateFolder(workspaceIdentifier: string, folderIdentifier: string, dto: UpdateFolderV2Dto): Promise<any>;

  deleteFolder(workspaceIdentifier: string, folderIdentifier: string): Promise<void>;
}
