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
  createApp(workspaceIdentifier: string, dto: CreateAppV2Dto): Promise<any>;

  renameApp(workspaceIdentifier: string, appIdentifier: string, dto: RenameAppV2Dto): Promise<any>;

  listApps(workspaceIdentifier: string, query: ListAppsV2QueryDto): Promise<any>;

  getApp(workspaceIdentifier: string, appIdentifier: string): Promise<any>;

  deleteApp(workspaceIdentifier: string, appIdentifier: string): Promise<void>;

  importApp(workspaceIdentifier: string, dto: ImportAppV2Dto): Promise<any>;

  exportApp(
    workspaceIdentifier: string,
    appIdentifier: string,
    exportTjdb?: boolean,
    appVersion?: string,
    exportAllVersions?: boolean
  ): Promise<any>;
}

export interface IExternalApisModulesControllerV2 {
  createModule(workspaceIdentifier: string, dto: CreateModuleV2Dto): Promise<any>;

  renameModule(workspaceIdentifier: string, moduleIdentifier: string, dto: RenameModuleV2Dto): Promise<any>;

  listModules(workspaceIdentifier: string, query: ListModulesV2QueryDto): Promise<any>;

  getModule(workspaceIdentifier: string, moduleIdentifier: string): Promise<any>;

  deleteModule(workspaceIdentifier: string, moduleIdentifier: string): Promise<void>;

  importModule(workspaceIdentifier: string, dto: ImportModuleV2Dto): Promise<any>;

  exportModule(workspaceIdentifier: string, moduleIdentifier: string, exportTjdb?: boolean): Promise<any>;
}

export interface IExternalApisWorkflowsControllerV2 {
  createWorkflow(workspaceIdentifier: string, dto: CreateWorkflowV2Dto): Promise<any>;

  renameWorkflow(workspaceIdentifier: string, workflowIdentifier: string, dto: RenameWorkflowV2Dto): Promise<any>;

  listWorkflows(workspaceIdentifier: string, query: ListWorkflowsV2QueryDto): Promise<any>;

  getWorkflow(workspaceIdentifier: string, workflowIdentifier: string): Promise<any>;

  deleteWorkflow(workspaceIdentifier: string, workflowIdentifier: string): Promise<void>;

  importWorkflow(workspaceIdentifier: string, dto: ImportWorkflowV2Dto): Promise<any>;

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
