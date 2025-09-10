// This file is handled by workflows team
// Helpers added here will be deprecated once the the whole test setup is revamped

import cookieParser = require('cookie-parser');
import { WsAdapter } from '@nestjs/platform-ws';
import { User } from '@entities/user.entity';
import { Test } from '@nestjs/testing';
import { OrganizationUser } from '@entities/organization_user.entity';
import { Organization } from '@entities/organization.entity';
import { Logger } from 'nestjs-pino';
import { InternalTable } from '@entities/internal_table.entity';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { INestApplication, ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { AppVersion } from '@entities/app_version.entity';
import { AppModule } from '@modules/app/module';
import { APP_TYPES } from '@modules/apps/constants';
import { App } from '@entities/app.entity';
import { AllExceptionsFilter } from '@modules/app/filters/all-exceptions-filter';
import { UserSessions } from '@entities/user_sessions.entity';
import { SessionType } from '@modules/external-apis/constants';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { DataSource } from '@entities/data_source.entity';
import { DataQuery } from '@entities/data_query.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { WorkflowDefinitionNode, WorkflowDefinitionEdge, WorkflowDefinitionQuery, WorkflowNodeData } from '../ee/workflows/services/workflow-executions.service';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE, ResourceType } from '@modules/group-permissions/constants';
import { BundleGenerationService } from '../ee/workflows/services/bundle-generation.service';


export const createUser = async (
    nestApp: INestApplication,
    userParams: { firstName: string; lastName: string; email: string; password: string; organizationId?: string }
): Promise<User> => {
    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const userRepository = defaultDataSource.getRepository(User);
    const organizationRepository = defaultDataSource.getRepository(Organization);

    let organization: Organization;
    if (userParams.organizationId) {
        organization = await organizationRepository.findOneOrFail({ where: { id: userParams.organizationId } });
    } else {
        organization = organizationRepository.create({
            name: 'Test Organization',
            slug: 'test-organization',
            status: 'active'
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
        status: 'active'
    });

    const savedUser = await userRepository.save(user);

    const orgUserRepository = defaultDataSource.getRepository(OrganizationUser);
    const organizationUser = orgUserRepository.create({
        userId: savedUser.id,
        organizationId: organization.id,
        role: 'admin',
        status: 'active'
    });
    await orgUserRepository.save(organizationUser);

    return savedUser;
};

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

    await updateInstanceSetting(nestApp, INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE, allowPersonalWorkspace.toString());

    const user = await createUser(nestApp, userParams);

    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const organizationRepository = defaultDataSource.getRepository(Organization);
    const organization = await organizationRepository.findOneOrFail({ where: { id: user.organizationId } });

    await createDefaultAppEnvironments(nestApp, organization.id);

    // Create workflow permissions if specified
    if (workflowPermissions) {
        await createUserWorkflowPermissions(nestApp, user, organization.id, workflowPermissions);
    }

    return { user, organization };
};

const createUserWorkflowPermissions = async (
    nestApp: INestApplication,
    user: User,
    organizationId: string,
    permissions: {
        isAllEditable?: boolean;
        workflowCreate?: boolean;
    }
): Promise<void> => {
    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const groupPermissionsRepository = defaultDataSource.getRepository(GroupPermissions);
    const granularPermissionsRepository = defaultDataSource.getRepository(GranularPermissions);
    const appsGroupPermissionsRepository = defaultDataSource.getRepository(AppsGroupPermissions);
    const groupUsersRepository = defaultDataSource.getRepository(GroupUsers);

    // Create a custom group for workflow permissions
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

    // Create granular permissions for workflows
    const granularPermission = granularPermissionsRepository.create({
        groupId: groupPermission.id,
        name: 'Workflows',
        type: ResourceType.WORKFLOWS,
        isAll: permissions.isAllEditable || false,
    });
    await granularPermissionsRepository.save(granularPermission);

    // Create apps group permissions for workflows
    const appsGroupPermission = appsGroupPermissionsRepository.create({
        granularPermissionId: granularPermission.id,
        appType: APP_TYPES.WORKFLOW,
        canEdit: permissions.isAllEditable || false,
        canView: true, // Always allow view
        hideFromDashboard: false,
    });
    await appsGroupPermissionsRepository.save(appsGroupPermission);

    // Associate user with the group
    const groupUser = groupUsersRepository.create({
        userId: user.id,
        groupId: groupPermission.id,
    });
    await groupUsersRepository.save(groupUser);
};

export const createWorkflowForUser = async (
    nestApp: INestApplication,
    user: User,
    appName: string
): Promise<App> => {
    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const appRepository = defaultDataSource.getRepository(App);

    if (!user.organizationId) user.organizationId = user.defaultOrganizationId;

    const app = appRepository.create({
        name: appName,
        slug: appName.toLowerCase().replace(/\s+/g, '-'),
        userId: user.id,
        organizationId: user.organizationId,
        isPublic: false,
        type: APP_TYPES.WORKFLOW,
        isMaintenanceOn: true
    });

    return await appRepository.save(app);
};

export const createApplicationVersion = async (
    nestApp: INestApplication,
    application: App,
    options: {
        name?: string;
        definition?: any;
        currentEnvironmentId?: string;
    } = {}
): Promise<AppVersion> => {
    const { name = 'v1', definition = null } = options;

    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const appVersionRepository = defaultDataSource.getRepository(AppVersion);
    const envRepository = defaultDataSource.getRepository(AppEnvironment);

    const developmentEnv = await envRepository.findOne({
        where: { organizationId: application.organizationId, name: 'development' }
    });

    const version = appVersionRepository.create({
        name: name + Date.now(),
        appId: application.id,
        definition: definition || {},
        currentEnvironmentId: developmentEnv?.id || null
    });

    return await appVersionRepository.save(version);
};

export const authenticateUser = async (
    app: INestApplication,
    email: string = 'admin@tooljet.io',
    organizationId?: string
) => {
    const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const userRepository = defaultDataSource.getRepository(User);
    const sessionRepository = defaultDataSource.getRepository(UserSessions);

    const user = await userRepository.findOneOrFail({
        where: { email },
        relations: ['organizationUsers', 'organizationUsers.organization']
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
            iat: Math.floor(Date.now() / 1000)
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
            organizationId: user.organizationId || user.defaultOrganizationId
        },
        tokenCookie: [`tj_auth_token=${token}; HttpOnly; Path=/`]
    };
};

export const authHeaderForUser = async (
    app: INestApplication,
    user: User,
    organizationId?: string,
    isPasswordLogin: boolean = true
): Promise<string> => {
    const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const sessionRepository = defaultDataSource.getRepository(UserSessions);

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
            isPasswordLogin,
            isSSOLogin: false,
            iat: Math.floor(Date.now() / 1000)
        },
        process.env.SECRET_KEY_BASE || 'secret',
        { expiresIn: '1h' }
    );

    return token;
};

const updateInstanceSetting = async (
    nestApp: INestApplication,
    key: string,
    value: string
): Promise<void> => {
    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const instanceSettingsRepository = defaultDataSource.getRepository(InstanceSettings);

    await instanceSettingsRepository.update(
        { key },
        { value }
    );
};

export async function clearDB(nestApp: INestApplication) {
    if (process.env.NODE_ENV !== 'test') return;

    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const tooljetDbDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('tooljetDb'));
    if (!defaultDataSource.isInitialized) await defaultDataSource.initialize();
    if (!tooljetDbDataSource.isInitialized) await tooljetDbDataSource.initialize();

    await dropTooljetDbTables(defaultDataSource, tooljetDbDataSource);

    const entities = defaultDataSource.entityMetadatas;
    for (const entity of entities) {
        const repository = defaultDataSource.getRepository(entity.name);

        if (
            [
                'app_group_permissions',
                'data_source_group_permissions',
                'group_permissions',
                'user_group_permissions',
            ].includes(entity.tableName)
        )
            continue;
        if (entity.tableName !== 'instance_settings') {
            await repository.query(`TRUNCATE ${entity.tableName} RESTART IDENTITY CASCADE;`);
        } else {
            await repository.query(`UPDATE ${entity.tableName} SET value='true' WHERE key='ALLOW_PERSONAL_WORKSPACE';`);
        }
    }
}

async function dropTooljetDbTables(defaultDataSource: TypeOrmDataSource, tooljetDbDataSource: TypeOrmDataSource) {
    const internalTables = await defaultDataSource.manager.find(InternalTable, {
        select: ['id'],
    });

    for (const table of internalTables) {
        await tooljetDbDataSource.query(`DROP TABLE IF EXISTS "${table.id}" CASCADE`);
    }
}

export const createDefaultAppEnvironments = async (
    nestApp: INestApplication,
    organizationId: string
): Promise<AppEnvironment[]> => {
    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const envRepository = defaultDataSource.getRepository(AppEnvironment);

    const environments = [
        {
            organizationId,
            name: 'development',
            isDefault: true,
            priority: 1,
            enabled: true,
        },
        {
            organizationId,
            name: 'staging',
            isDefault: false,
            priority: 2,
            enabled: true,
        },
        {
            organizationId,
            name: 'production',
            isDefault: false,
            priority: 3,
            enabled: true,
        },
    ];

    const createdEnvs = [];
    for (const env of environments) {
        const environment = envRepository.create(env);
        const savedEnv = await envRepository.save(environment);
        createdEnvs.push(savedEnv);
    }

    return createdEnvs;
};

export const createWorkflowExecution = async (
    nestApp: INestApplication,
    appVersion: AppVersion,
    user: User
): Promise<WorkflowExecution> => {
    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const workflowExecutionRepository = defaultDataSource.getRepository(WorkflowExecution);

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

export const createNestAppInstance = async (options: {
    edition?: 'ce' | 'ee' | 'cloud';
    isGetContext?: boolean;
    mockProviders?: any[];
} = {}): Promise<INestApplication> => {
    const { edition = 'ce', isGetContext = true, mockProviders = [] } = options;
    if (edition) process.env.TOOLJET_EDITION = edition;

    const moduleBuilder = Test.createTestingModule({
        imports: [await AppModule.register({ IS_GET_CONTEXT: isGetContext })],
        providers: [],
    });

    // Apply mock providers if provided - override each provider
    for (const mockProvider of mockProviders) {
        moduleBuilder.overrideProvider(mockProvider.provide).useValue(mockProvider.useValue);
    }

    const moduleRef = await moduleBuilder.compile();

    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalFilters(new AllExceptionsFilter(moduleRef.get(Logger)));
    app.useWebSocketAdapter(new WsAdapter(app));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: VERSION_NEUTRAL,
    });
    await app.init();

    return app;
};

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
    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const dataSourceRepository = defaultDataSource.getRepository(DataSource);

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
        updatedAt: new Date()
    });

    const savedDataSource = await dataSourceRepository.save(dataSource);

    // Create DataSourceOptions for the environment
    const dataSourceOptionsRepository = defaultDataSource.getRepository(DataSourceOptions);
    const dataSourceOptions = dataSourceOptionsRepository.create({
        environmentId: environmentId,
        dataSourceId: savedDataSource.id,
        options: {} // Default empty options for the data source
    });
    await dataSourceOptionsRepository.save(dataSourceOptions);

    return savedDataSource;
};

export const createWorkflowDataQuery = async (
    nestApp: INestApplication,
    appVersion: AppVersion,
    dataSource: DataSource,
    queryConfig: {
        name: string;
        options: Record<string, any>;
    }
): Promise<DataQuery> => {
    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const dataQueryRepository = defaultDataSource.getRepository(DataQuery);

    const dataQuery = dataQueryRepository.create({
        id: require('crypto').randomUUID(),
        name: queryConfig.name,
        options: queryConfig.options,
        dataSourceId: dataSource.id,
        appVersionId: appVersion.id,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    return await dataQueryRepository.save(dataQuery);
};


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
    message: config.message || '{}'
});

export const buildRunPyOptions = (code: string) => ({
    code
});

/**
 * Workflow Definition Types
 * These are aliases to the actual types from the workflow execution service
 */

// Create a more flexible version of WorkflowNodeData for testing
interface TestWorkflowNodeData extends Partial<Omit<WorkflowNodeData, 'nodeType'>> {
    nodeType?: 'start' | 'query' | 'workflow' | 'response';
    nodeName?: string;
}

// Node type with additional properties needed for testing
export interface WorkflowNode extends Omit<WorkflowDefinitionNode, 'data'> {
    data: TestWorkflowNodeData;
    position: { x: number; y: number };
    sourcePosition?: string;
    targetPosition?: string;
}

// Edge type alias
export type WorkflowEdge = WorkflowDefinitionEdge;

// Query type with additional properties needed for testing
export interface WorkflowQuery extends Partial<WorkflowDefinitionQuery> {
    idOnDefinition: string;
    dataSourceKind: 'runjs' | 'restapi' | 'runpy' | 'grpcv2';
    name: string;
    options: Record<string, any>;
}

export const buildWorkflowDefinition = (config: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    queries: Array<{
        idOnDefinition: string;
        id?: string;
    }>;
    setupScript?: string;
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
    defaultParams: config.defaultParams || '{}'
});

export const createCompleteWorkflow = async (
    nestApp: INestApplication,
    user: User,
    workflowConfig: {
        name: string;
        setupScript?: string;
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
    // Create the workflow app
    const app = await createWorkflowForUser(nestApp, user, workflowConfig.name);

    // Prepare queries definition with idOnDefinition
    const queriesDefinition = workflowConfig.queries.map(q => ({
        idOnDefinition: q.idOnDefinition,
        id: null as string | null
    }));

    // Create app version with workflow definition
    const appVersion = await createApplicationVersion(nestApp, app, {
        definition: buildWorkflowDefinition({
            nodes: workflowConfig.nodes,
            edges: workflowConfig.edges,
            queries: queriesDefinition,
            setupScript: workflowConfig.setupScript,
            dependencies: workflowConfig.dependencies
        })
    });

    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));

    // Create data sources and queries
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

        const dataQuery = await createWorkflowDataQuery(
            nestApp,
            appVersion,
            dataSource,
            {
                name: queryConfig.name,
                options: queryConfig.options
            }
        );

        dataQueries.push(dataQuery);

        // Update the app version definition with the actual data query ID
        const queryDefIndex = queriesDefinition.findIndex(
            q => q.idOnDefinition === queryConfig.idOnDefinition
        );
        if (queryDefIndex !== -1) {
            queriesDefinition[queryDefIndex].id = dataQuery.id;
        }
    }

    // Update app version with the linked query IDs
    appVersion.definition.queries = queriesDefinition;
    await defaultDataSource.getRepository(AppVersion).save(appVersion);

    return {
        app,
        appVersion,
        dataQueries,
        dataSources
    };
};


export const createWorkflowBundle = async (
    nestApp: INestApplication,
    appVersionId: string,
    dependencies: Record<string, string>
): Promise<void> => {
    const bundleGenerationService = nestApp.get<BundleGenerationService>(BundleGenerationService);
    
    // Use the bundle generation service to update packages
    // This will handle both creating new bundles and updating existing ones
    await bundleGenerationService.updatePackages(appVersionId, dependencies);
};

