/**
 * Workflow-specific test helpers -- factories for workflow apps, data sources, queries, executions, bundles, and permissions.
 */
import { INestApplication } from '@nestjs/common';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { DataSource } from '@entities/data_source.entity';
import { DataQuery } from '@entities/data_query.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE, ResourceType } from '@modules/group-permissions/constants';
import { APP_TYPES } from '@modules/apps/constants';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import {
  WorkflowDefinitionNode,
  WorkflowDefinitionEdge,
  WorkflowDefinitionQuery,
  WorkflowNodeData,
} from '../../ee/workflows/services/workflow-executions.service';
import { JavaScriptBundleGenerationService } from '../../ee/workflows/services/bundle-generation.service';
import { PythonBundleGenerationService } from '../../ee/workflows/services/python-bundle-generation.service';
import { UserSessions } from '@entities/user_sessions.entity';
import { SessionType } from '@modules/external-apis/constants';
import { getDefaultDataSource } from './setup';
import { ensureAppEnvironments } from './seed';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Flexible version of WorkflowNodeData for testing. */
interface TestWorkflowNodeData extends Partial<Omit<WorkflowNodeData, 'nodeType'>> {
  nodeType?: 'start' | 'query' | 'workflow' | 'response';
  nodeName?: string;
}

/** Node type with additional properties needed for testing. */
export interface WorkflowNode extends Omit<WorkflowDefinitionNode, 'data'> {
  data: TestWorkflowNodeData;
  position: { x: number; y: number };
  sourcePosition?: string;
  targetPosition?: string;
}

/** Edge type alias. */
export type WorkflowEdge = WorkflowDefinitionEdge;

/** Query type with additional properties needed for testing. */
export interface WorkflowQuery extends Partial<WorkflowDefinitionQuery> {
  idOnDefinition: string;
  dataSourceKind: 'runjs' | 'restapi' | 'runpy' | 'grpcv2';
  name: string;
  options: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Instance settings
// ---------------------------------------------------------------------------

async function updateInstanceSetting(key: string, value: string): Promise<void> {
  const ds = getDefaultDataSource();
  const instanceSettingsRepository = ds.getRepository(InstanceSettings);
  await instanceSettingsRepository.update({ key }, { value });
}

// ---------------------------------------------------------------------------
// Authentication (direct DB session — no HTTP call)
// ---------------------------------------------------------------------------

/**
 * Creates a user session and JWT directly in the database.
 * Unlike the HTTP `login` in api.ts, this does NOT call /api/authenticate
 * and works with plaintext passwords (as used by createWorkflowUser).
 */
export const workflowLogin = async (
  app: INestApplication,
  email: string = 'admin@tooljet.io',
  organizationId?: string
): Promise<{ user: { id: string; email: string; firstName: string; lastName: string; organizationId: string }; tokenCookie: string[] }> => {
  const ds = getDefaultDataSource();
  const userRepository = ds.getRepository(User);
  const sessionRepository = ds.getRepository(UserSessions);

  const user = await userRepository.findOneOrFail({
    where: { email },
    relations: ['organizationUsers', 'organizationUsers.organization'],
  });

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  const session = sessionRepository.create({
    userId: user.id,
    device: 'e2e-test',
    expiry: expiry,
    lastLoggedIn: new Date(),
    sessionType: SessionType.USER,
  });
  await sessionRepository.save(session);

  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    {
      sessionId: session.id,
      username: user.id,
      sub: user.email,
      organizationIds: [organizationId || user.organizationId || user.defaultOrganizationId],
      isPasswordLogin: true,
      isSSOLogin: false,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.SECRET_KEY_BASE || 'secret',
    { expiresIn: '1h' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId || user.defaultOrganizationId,
    },
    tokenCookie: [`tj_auth_token=${token}; HttpOnly; Path=/`],
  };
};

// ---------------------------------------------------------------------------
// Organization & user setup
// ---------------------------------------------------------------------------

/**
 * Creates a user with an organization, default app environments, and optional workflow permissions.
 *
 * NOTE: This uses a simplified user creation path (no group permissions, no SSO configs)
 * compared to the main `createUser` in seed.ts. It is intentionally kept separate because
 * the workflow tests expect this specific setup shape (raw user + org, no default group scaffolding).
 */
export const setupOrganizationAndUser = async (
  nestApp: INestApplication,
  userParams: { email: string; password: string; firstName: string; lastName: string },
  options: {
    allowPersonalWorkspace?: boolean;
    workflowPermissions?: {
      isAllEditable?: boolean;
      workflowCreate?: boolean;
    };
  } = {}
): Promise<{ user: User; organization: Organization }> => {
  const { allowPersonalWorkspace = true, workflowPermissions } = options;

  await updateInstanceSetting(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE, allowPersonalWorkspace.toString());

  const user = await createWorkflowUser(nestApp, userParams);

  const ds = getDefaultDataSource();
  const organizationRepository = ds.getRepository(Organization);
  const organization = await organizationRepository.findOneOrFail({ where: { id: user.organizationId } });

  await ensureAppEnvironments(nestApp, organization.id);

  if (workflowPermissions) {
    await createUserWorkflowPermissions(nestApp, user, organization.id, workflowPermissions);
  }

  return { user, organization };
};

/**
 * Creates a bare user+org for workflow tests.
 * Unlike the main createUser in seed.ts, this does NOT create default group permissions
 * or SSO configs — workflow tests use a simpler setup.
 */
export const createWorkflowUser = async (
  nestApp: INestApplication,
  userParams: { firstName: string; lastName: string; email: string; password: string; organizationId?: string }
): Promise<User> => {
  const ds = getDefaultDataSource();
  const userRepository = ds.getRepository(User);
  const organizationRepository = ds.getRepository(Organization);
  const orgUserRepository = ds.getRepository(OrganizationUser);

  let organization: Organization;
  if (userParams.organizationId) {
    organization = await organizationRepository.findOneOrFail({ where: { id: userParams.organizationId } });
  } else {
    organization = organizationRepository.create({
      name: 'Test Organization',
      slug: 'test-organization',
      status: 'active',
    });
    organization = await organizationRepository.save(organization);
  }

  const user = userRepository.create({
    email: userParams.email,
    firstName: userParams.firstName,
    lastName: userParams.lastName,
    password: userParams.password,
    organizationId: organization.id,
    defaultOrganizationId: organization.id,
    status: 'active',
  });

  const savedUser = await userRepository.save(user);

  const organizationUser = orgUserRepository.create({
    userId: savedUser.id,
    organizationId: organization.id,
    role: 'admin',
    status: 'active',
  });
  await orgUserRepository.save(organizationUser);

  return savedUser;
};

// ---------------------------------------------------------------------------
// Workflow permissions
// ---------------------------------------------------------------------------

/** Creates a custom group with workflow permissions and associates the user. */
export const createUserWorkflowPermissions = async (
  nestApp: INestApplication,
  user: User,
  organizationId: string,
  permissions: {
    isAllEditable?: boolean;
    workflowCreate?: boolean;
  }
): Promise<void> => {
  const ds = getDefaultDataSource();
  const groupPermissionsRepository = ds.getRepository(GroupPermissions);
  const granularPermissionsRepository = ds.getRepository(GranularPermissions);
  const appsGroupPermissionsRepository = ds.getRepository(AppsGroupPermissions);
  const groupUsersRepository = ds.getRepository(GroupUsers);

  const groupPermission = groupPermissionsRepository.create({
    organizationId,
    name: `wf-test-${user.id.substring(0, 20)}`,
    type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
    workflowCreate: permissions.workflowCreate || false,
    appCreate: false,
    appDelete: false,
    folderCRUD: false,
    orgConstantCRUD: false,
    dataSourceCreate: false,
    dataSourceDelete: false,
    appPromote: false,
    appRelease: false,
  });
  await groupPermissionsRepository.save(groupPermission);

  const granularPermission = granularPermissionsRepository.create({
    groupId: groupPermission.id,
    name: 'Workflows',
    type: ResourceType.WORKFLOWS,
    isAll: permissions.isAllEditable || false,
  });
  await granularPermissionsRepository.save(granularPermission);

  const appsGroupPermission = appsGroupPermissionsRepository.create({
    granularPermissionId: granularPermission.id,
    appType: APP_TYPES.WORKFLOW,
    canEdit: permissions.isAllEditable || false,
    canView: true,
    hideFromDashboard: false,
  });
  await appsGroupPermissionsRepository.save(appsGroupPermission);

  const groupUser = groupUsersRepository.create({
    userId: user.id,
    groupId: groupPermission.id,
  });
  await groupUsersRepository.save(groupUser);
};

// ---------------------------------------------------------------------------
// Workflow app & version factories
// ---------------------------------------------------------------------------

/** Creates a workflow-type App for a given user. */
export const createWorkflowForUser = async (
  nestApp: INestApplication,
  user: User,
  appName: string
): Promise<App> => {
  const ds = getDefaultDataSource();
  const appRepository = ds.getRepository(App);

  if (!user.organizationId) user.organizationId = user.defaultOrganizationId;

  const app = appRepository.create({
    name: appName,
    slug: appName.toLowerCase().replace(/\s+/g, '-'),
    userId: user.id,
    organizationId: user.organizationId,
    isPublic: false,
    type: APP_TYPES.WORKFLOW,
    isMaintenanceOn: true,
  });

  return await appRepository.save(app);
};

/** Creates an AppVersion for a workflow app with an optional definition. */
export const createWorkflowApplicationVersion = async (
  nestApp: INestApplication,
  application: App,
  options: {
    name?: string;
    definition?: any;
    currentEnvironmentId?: string;
  } = {}
): Promise<AppVersion> => {
  const { name = 'v1', definition = null } = options;

  const ds = getDefaultDataSource();
  const appVersionRepository = ds.getRepository(AppVersion);
  const envRepository = ds.getRepository(AppEnvironment);

  const developmentEnv = await envRepository.findOne({
    where: { organizationId: application.organizationId, name: 'development' },
  });

  const version = appVersionRepository.create({
    name: name + Date.now(),
    appId: application.id,
    definition: definition || {},
    currentEnvironmentId: developmentEnv?.id || null,
  });

  return await appVersionRepository.save(version);
};

// ---------------------------------------------------------------------------
// Workflow data source & query factories
// ---------------------------------------------------------------------------

/** Creates a DataSource for a workflow (global scope, with DataSourceOptions). */
export const createWorkflowDataSource = async (
  nestApp: INestApplication,
  organizationId: string,
  appVersionId: string,
  kind: string,
  environmentId: string,
  options: {
    name?: string;
    type?: 'static' | 'default' | 'sample';
    scope?: 'global' | 'local';
    pluginId?: string;
  } = {}
): Promise<DataSource> => {
  const ds = getDefaultDataSource();
  const dataSourceRepository = ds.getRepository(DataSource);

  const dataSource = dataSourceRepository.create({
    id: require('crypto').randomUUID(),
    name: options.name || (options.type === 'static' ? `${kind}default` : kind),
    kind: kind,
    type: options.type || 'default',
    scope: options.scope || 'global',
    pluginId: options.pluginId || null,
    appVersionId: (options.scope || 'global') === 'global' ? null : appVersionId,
    organizationId: organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const savedDataSource = await dataSourceRepository.save(dataSource);

  const dataSourceOptionsRepository = ds.getRepository(DataSourceOptions);
  const dataSourceOptions = dataSourceOptionsRepository.create({
    environmentId: environmentId,
    dataSourceId: savedDataSource.id,
    options: {},
  });
  await dataSourceOptionsRepository.save(dataSourceOptions);

  return savedDataSource;
};

/** Creates a DataQuery attached to a workflow data source. */
export const createWorkflowDataQuery = async (
  nestApp: INestApplication,
  appVersion: AppVersion,
  dataSource: DataSource,
  queryConfig: {
    name: string;
    options: Record<string, any>;
  }
): Promise<DataQuery> => {
  const ds = getDefaultDataSource();
  const dataQueryRepository = ds.getRepository(DataQuery);

  const dataQuery = dataQueryRepository.create({
    id: require('crypto').randomUUID(),
    name: queryConfig.name,
    options: queryConfig.options,
    dataSourceId: dataSource.id,
    appVersionId: appVersion.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return await dataQueryRepository.save(dataQuery);
};

// ---------------------------------------------------------------------------
// Workflow execution factory
// ---------------------------------------------------------------------------

/** Creates a WorkflowExecution record in the database. */
export const createWorkflowExecution = async (
  nestApp: INestApplication,
  appVersion: AppVersion,
  user: User
): Promise<WorkflowExecution> => {
  const ds = getDefaultDataSource();
  const workflowExecutionRepository = ds.getRepository(WorkflowExecution);

  const workflowExecution = workflowExecutionRepository.create({
    appVersionId: appVersion.id,
    executingUserId: user.id,
    executed: true,
    status: 'success',
    logs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return await workflowExecutionRepository.save(workflowExecution);
};

// ---------------------------------------------------------------------------
// Workflow definition builders
// ---------------------------------------------------------------------------

/** Builds query options for a gRPC data source. */
export const buildGrpcOptions = (config: {
  proto?: string;
  service?: string;
  rpc?: string;
  metadata?: Record<string, string>;
  message?: string;
}) => ({
  proto: config.proto || '',
  service: config.service || '',
  rpc: config.rpc || '',
  metadata: config.metadata || {},
  message: config.message || '{}',
});

/** Builds query options for a Python runner data source. */
export const buildRunPyOptions = (code: string) => ({
  code,
});

/** Builds a complete workflow definition object from nodes, edges, queries, and optional config. */
export const buildWorkflowDefinition = (config: {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  queries: Array<{
    idOnDefinition: string;
    id?: string;
  }>;
  setupScript?: Record<string, string>;
  dependencies?: Record<string, string>;
  webhookParams?: any[];
  defaultParams?: string;
}) => ({
  nodes: config.nodes,
  edges: config.edges,
  queries: config.queries,
  setupScript: config.setupScript || undefined,
  dependencies: config.dependencies || undefined,
  webhookParams: config.webhookParams || [],
  defaultParams: config.defaultParams || '{}',
});

// ---------------------------------------------------------------------------
// Composite workflow factory
// ---------------------------------------------------------------------------

/**
 * Creates a complete workflow with app, version, data sources, and data queries
 * all wired together with a workflow definition.
 */
export const createCompleteWorkflow = async (
  nestApp: INestApplication,
  user: User,
  workflowConfig: {
    name: string;
    setupScript?: Record<string, string>;
    dependencies?: Record<string, string>;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    queries: WorkflowQuery[];
  }
): Promise<{
  app: App;
  appVersion: AppVersion;
  dataQueries: DataQuery[];
  dataSources: DataSource[];
}> => {
  const app = await createWorkflowForUser(nestApp, user, workflowConfig.name);

  const queriesDefinition = workflowConfig.queries.map((q) => ({
    idOnDefinition: q.idOnDefinition,
    id: null as string | null,
  }));

  const appVersion = await createWorkflowApplicationVersion(nestApp, app, {
    definition: buildWorkflowDefinition({
      nodes: workflowConfig.nodes,
      edges: workflowConfig.edges,
      queries: queriesDefinition,
      setupScript: workflowConfig.setupScript,
      dependencies: workflowConfig.dependencies,
    }),
  });

  const ds = getDefaultDataSource();

  const dataSources: DataSource[] = [];
  const dataQueries: DataQuery[] = [];

  // Group queries by data source kind
  const queryGroups = new Map<string, WorkflowQuery[]>();
  for (const query of workflowConfig.queries) {
    const existing = queryGroups.get(query.dataSourceKind) || [];
    existing.push(query);
    queryGroups.set(query.dataSourceKind, existing);
  }

  // Create data sources for each kind
  const dataSourceMap = new Map<string, DataSource>();
  for (const [kind] of queryGroups) {
    const dataSource = await createWorkflowDataSource(
      nestApp,
      user.organizationId || user.defaultOrganizationId,
      appVersion.id,
      kind as any,
      appVersion.currentEnvironmentId,
      { type: 'static', scope: 'global' }
    );
    dataSources.push(dataSource);
    dataSourceMap.set(kind, dataSource);
  }

  // Create data queries and update definition
  for (let i = 0; i < workflowConfig.queries.length; i++) {
    const queryConfig = workflowConfig.queries[i];
    const dataSource = dataSourceMap.get(queryConfig.dataSourceKind)!;

    const dataQuery = await createWorkflowDataQuery(nestApp, appVersion, dataSource, {
      name: queryConfig.name,
      options: queryConfig.options,
    });

    dataQueries.push(dataQuery);

    const queryDefIndex = queriesDefinition.findIndex((q) => q.idOnDefinition === queryConfig.idOnDefinition);
    if (queryDefIndex !== -1) {
      queriesDefinition[queryDefIndex].id = dataQuery.id;
    }
  }

  // Update app version with the linked query IDs
  appVersion.definition.queries = queriesDefinition;
  await ds.getRepository(AppVersion).save(appVersion);

  return { app, appVersion, dataQueries, dataSources };
};

// ---------------------------------------------------------------------------
// Bundle factory
// ---------------------------------------------------------------------------

/**
 * Creates a bundle for workflow execution.
 * @param language - 'javascript' or 'python'
 */
export const createBundle = async (
  nestApp: INestApplication,
  appVersionId: string,
  dependencies: Record<string, string> | string,
  language: 'javascript' | 'python'
): Promise<void> => {
  if (language === 'javascript') {
    const service = nestApp.get<JavaScriptBundleGenerationService>(JavaScriptBundleGenerationService);
    await service.generateBundle(appVersionId, dependencies as Record<string, string>);
    const bundle = await service.getBundleForExecution(appVersionId);
    if (!bundle) {
      throw new Error('JavaScript bundle was not created successfully');
    }
  } else if (language === 'python') {
    const service = nestApp.get<PythonBundleGenerationService>(PythonBundleGenerationService);
    await service.generateBundle(appVersionId, dependencies as string);
    const bundle = await service.getBundleForExecution(appVersionId);
    if (!bundle) {
      throw new Error('Python bundle was not created successfully');
    }
  } else {
    throw new Error(`Unsupported language: ${language}`);
  }
};
