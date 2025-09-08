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
import { createMock } from '@golevelup/ts-jest';

let AbilityService: any, FeatureAbilityFactory: any, UserPermissions: any, FEATURE_KEY: any;

async function loadAbilityTypes() {
    if (!AbilityService) {
        AbilityService = (await import('../src/modules/ability/interfaces/IService')).AbilityService;
        FeatureAbilityFactory = (await import('../ee/workflows/ability/app')).FeatureAbilityFactory;
        FEATURE_KEY = (await import('../src/modules/workflows/constants')).FEATURE_KEY;
    }
}

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
    options: { allowPersonalWorkspace?: boolean } = {}
): Promise<{ user: User; organization: Organization }> => {
    const { allowPersonalWorkspace = true } = options;

    await updateInstanceSetting(nestApp, INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE, allowPersonalWorkspace.toString());

    const user = await createUser(nestApp, userParams);

    const defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const organizationRepository = defaultDataSource.getRepository(Organization);
    const organization = await organizationRepository.findOneOrFail({ where: { id: user.organizationId } });

    await createDefaultAppEnvironments(nestApp, organization.id);

    return { user, organization };
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
    password: string = 'password',
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

    let moduleBuilder = Test.createTestingModule({
        imports: [await AppModule.register({ IS_GET_CONTEXT: isGetContext })],
        providers: [],
    });

    // Apply mock providers if provided
    for (const mockProvider of mockProviders) {
        moduleBuilder = moduleBuilder.overrideProvider(mockProvider.provide).useValue(mockProvider.useValue);
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
    console.log('Initializing Nest application instance...');
    await app.init();

    return app;
};

/**
 * Creates mock providers for features that require ability/permission checks
 */
export const createFeatureMocks = async () => {
    await loadAbilityTypes();

    // Mock UserPermissions with admin privileges
    const mockUserPermissions = {
        isAdmin: true,
        isSuperAdmin: true,
        isBuilder: true,
        isEndUser: true,
        appCreate: true,
        appDelete: true,
        workflowCreate: true,
        workflowDelete: true,
        appPromote: true,
        appRelease: true,
        dataSourceCreate: true,
        dataSourceDelete: true,
        folderCRUD: true,
        orgConstantCRUD: true,
        orgVariableCRUD: true,
    };

    const abilityServiceMock = createMock<typeof AbilityService>();
    (abilityServiceMock as any).resourceActionsPermission.mockResolvedValue(mockUserPermissions);
    (abilityServiceMock as any).getResourcePermission.mockResolvedValue([]);

    const featureAbilityFactoryMock = createMock<typeof FeatureAbilityFactory>();
    const mockAbility = {
        can: jest.fn().mockImplementation((feature: string) => {
            return feature === FEATURE_KEY.NPM_PACKAGES || true;
        })
    };
    (featureAbilityFactoryMock as any).createAbility.mockResolvedValue(mockAbility);

    return [
        { provide: AbilityService, useValue: abilityServiceMock },
        { provide: FeatureAbilityFactory, useValue: featureAbilityFactoryMock }
    ];
};