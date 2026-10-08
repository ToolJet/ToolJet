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
  AppV2ResponseDto,
  ListAppsV2ResponseDto,
  ModuleV2ResponseDto,
  ListModulesV2ResponseDto,
  WorkflowV2ResponseDto,
  ListWorkflowsV2ResponseDto,
  FolderV2ResponseDto,
  ListFoldersV2ResponseDto,
  ResourceExportV2ResponseDto,
  ExportResourceV2QueryDto,
  ListEnvironmentsV2ResponseDto,
  CreateAppVersionV2Dto,
  UpdateAppVersionV2Dto,
  PromoteAppVersionV2Dto,
  ListAppVersionsV2QueryDto,
  AppVersionV2ResponseDto,
  ListAppVersionsV2ResponseDto,
  ListDataSourcesV2QueryDto,
  GetDataSourceV2QueryDto,
  ListDataSourceQueriesV2QueryDto,
  TestDataSourceConnectionV2Dto,
  DataSourceV2ResponseDto,
  ListDataSourcesV2ResponseDto,
  ListDataSourceQueriesV2ResponseDto,
  TestDataSourceConnectionV2ResponseDto,
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
  createApp(workspaceIdentifier: string, dto: CreateAppV2Dto): Promise<AppV2ResponseDto>;

  renameApp(workspaceIdentifier: string, appIdentifier: string, dto: RenameAppV2Dto): Promise<AppV2ResponseDto>;

  listApps(workspaceIdentifier: string, query: ListAppsV2QueryDto): Promise<ListAppsV2ResponseDto>;

  getApp(workspaceIdentifier: string, appIdentifier: string): Promise<AppV2ResponseDto>;

  deleteApp(workspaceIdentifier: string, appIdentifier: string): Promise<void>;

  importApp(workspaceIdentifier: string, dto: ImportAppV2Dto): Promise<AppV2ResponseDto>;

  exportApp(
    workspaceIdentifier: string,
    appIdentifier: string,
    query: ExportResourceV2QueryDto
  ): Promise<ResourceExportV2ResponseDto>;
}

export interface IExternalApisModulesControllerV2 {
  createModule(workspaceIdentifier: string, dto: CreateModuleV2Dto): Promise<ModuleV2ResponseDto>;

  renameModule(
    workspaceIdentifier: string,
    moduleIdentifier: string,
    dto: RenameModuleV2Dto
  ): Promise<ModuleV2ResponseDto>;

  listModules(workspaceIdentifier: string, query: ListModulesV2QueryDto): Promise<ListModulesV2ResponseDto>;

  getModule(workspaceIdentifier: string, moduleIdentifier: string): Promise<ModuleV2ResponseDto>;

  deleteModule(workspaceIdentifier: string, moduleIdentifier: string): Promise<void>;

  importModule(workspaceIdentifier: string, dto: ImportModuleV2Dto): Promise<ModuleV2ResponseDto>;

  exportModule(
    workspaceIdentifier: string,
    moduleIdentifier: string,
    query: ExportResourceV2QueryDto
  ): Promise<ResourceExportV2ResponseDto>;
}

export interface IExternalApisWorkflowsControllerV2 {
  createWorkflow(workspaceIdentifier: string, dto: CreateWorkflowV2Dto): Promise<WorkflowV2ResponseDto>;

  renameWorkflow(
    workspaceIdentifier: string,
    workflowIdentifier: string,
    dto: RenameWorkflowV2Dto
  ): Promise<WorkflowV2ResponseDto>;

  listWorkflows(workspaceIdentifier: string, query: ListWorkflowsV2QueryDto): Promise<ListWorkflowsV2ResponseDto>;

  getWorkflow(workspaceIdentifier: string, workflowIdentifier: string): Promise<WorkflowV2ResponseDto>;

  deleteWorkflow(workspaceIdentifier: string, workflowIdentifier: string): Promise<void>;

  importWorkflow(workspaceIdentifier: string, dto: ImportWorkflowV2Dto): Promise<WorkflowV2ResponseDto>;

  exportWorkflow(
    workspaceIdentifier: string,
    workflowIdentifier: string,
    query: ExportResourceV2QueryDto
  ): Promise<ResourceExportV2ResponseDto>;
}

// Shared by the App/Module/Workflow Folders controllers — identical shape for all three,
// the resource type is fixed per-controller rather than passed by the caller.
export interface IExternalApisFoldersControllerV2 {
  createFolder(workspaceIdentifier: string, dto: CreateFolderV2Dto): Promise<FolderV2ResponseDto>;

  listFolders(workspaceIdentifier: string, query: ListFoldersV2QueryDto): Promise<ListFoldersV2ResponseDto>;

  getFolder(workspaceIdentifier: string, folderIdentifier: string): Promise<FolderV2ResponseDto>;

  updateFolder(
    workspaceIdentifier: string,
    folderIdentifier: string,
    dto: UpdateFolderV2Dto
  ): Promise<FolderV2ResponseDto>;

  deleteFolder(workspaceIdentifier: string, folderIdentifier: string): Promise<void>;
}

export interface IExternalApisEnvironmentsControllerV2 {
  listEnvironments(workspaceIdentifier: string): Promise<ListEnvironmentsV2ResponseDto>;
}

// Shared by the App/Module/Workflow Versions controllers — the resource type is fixed per controller.
export interface IExternalApisVersionsControllerV2 {
  createVersion(
    workspaceIdentifier: string,
    resourceIdentifier: string,
    dto: CreateAppVersionV2Dto
  ): Promise<AppVersionV2ResponseDto>;

  saveVersion(
    workspaceIdentifier: string,
    resourceIdentifier: string,
    versionId: string
  ): Promise<AppVersionV2ResponseDto>;

  promoteVersion(
    workspaceIdentifier: string,
    resourceIdentifier: string,
    versionId: string,
    dto: PromoteAppVersionV2Dto
  ): Promise<AppVersionV2ResponseDto>;

  releaseVersion(
    workspaceIdentifier: string,
    resourceIdentifier: string,
    versionId: string
  ): Promise<AppVersionV2ResponseDto>;

  listVersions(
    workspaceIdentifier: string,
    resourceIdentifier: string,
    query: ListAppVersionsV2QueryDto
  ): Promise<ListAppVersionsV2ResponseDto>;

  getVersion(
    workspaceIdentifier: string,
    resourceIdentifier: string,
    versionId: string
  ): Promise<AppVersionV2ResponseDto>;

  updateVersion(
    workspaceIdentifier: string,
    resourceIdentifier: string,
    versionId: string,
    dto: UpdateAppVersionV2Dto
  ): Promise<AppVersionV2ResponseDto>;

  deleteVersion(workspaceIdentifier: string, resourceIdentifier: string, versionId: string): Promise<void>;
}

export interface IExternalApisDataSourcesControllerV2 {
  listDataSources(workspaceIdentifier: string, query: ListDataSourcesV2QueryDto): Promise<ListDataSourcesV2ResponseDto>;

  getDataSource(
    workspaceIdentifier: string,
    dataSourceId: string,
    query: GetDataSourceV2QueryDto
  ): Promise<DataSourceV2ResponseDto>;

  listDataSourceQueries(
    workspaceIdentifier: string,
    dataSourceId: string,
    query: ListDataSourceQueriesV2QueryDto
  ): Promise<ListDataSourceQueriesV2ResponseDto>;

  testConnection(
    workspaceIdentifier: string,
    dataSourceId: string,
    dto: TestDataSourceConnectionV2Dto
  ): Promise<TestDataSourceConnectionV2ResponseDto>;
}
