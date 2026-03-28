/* eslint-disable prefer-const */
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource as TypeOrmDataSource, Repository } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { OrganizationUser } from '@entities/organization_user.entity';
import { Organization } from '@entities/organization.entity';
import { User } from '@entities/user.entity';
import { App } from '@entities/app.entity';
import { File } from '@entities/file.entity';
import { Plugin } from '@entities/plugin.entity';
import { INestApplication, ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@modules/app/module';
import { AppVersion } from '@entities/app_version.entity';
import { DataQuery } from '@entities/data_query.entity';
import { DataSource } from '@entities/data_source.entity';
import { PluginsService } from '@modules/plugins/service';
import { DataSourcesService } from '@modules/data-sources/service';
import { PluginsModule } from '@modules/plugins/module';
import { DataSourcesModule } from '@modules/data-sources/module';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE, ResourceType } from '@modules/group-permissions/constants';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { DataSourcesGroupPermissions } from '@entities/data_sources_group_permissions.entity';
import { GroupApps } from '@entities/group_apps.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { AllExceptionsFilter } from '@modules/app/filters/all-exceptions-filter';
import { Logger } from 'nestjs-pino';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppsModule } from '@modules/apps/module';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { v4 as uuidv4 } from 'uuid';
import { CreateFileDto } from '@modules/files/dto';
import { CreatePluginDto } from '@modules/plugins/dto';
import * as request from 'supertest';
import { AppEnvironment } from '@entities/app_environments.entity';
import { defaultAppEnvironments } from '@helpers/utils.helper';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import * as cookieParser from 'cookie-parser';
import { LicenseService } from '@modules/licensing/service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { InternalTable } from '@entities/internal_table.entity';
import * as fs from 'fs';

globalThis.TOOLJET_VERSION = fs.readFileSync('./.version', 'utf8').trim();

export async function createNestAppInstance(): Promise<INestApplication> {
  let app: INestApplication;

  const moduleBuilder = Test.createTestingModule({
    imports: [await AppModule.register({ IS_GET_CONTEXT: true })],
    providers: [],
  });

  // Mock LicenseTermsService to allow all features in tests
  moduleBuilder.overrideProvider(LicenseTermsService).useValue({
    getLicenseTerms: jest.fn().mockResolvedValue(true),
    getLicenseTermsInstance: jest.fn().mockResolvedValue(true),
  });

  const moduleRef = await moduleBuilder.compile();

  app = moduleRef.createNestApplication();
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
  setDataSources(app);

  return app;
}

export async function createNestAppInstanceWithEnvMock(): Promise<{
  app: INestApplication;
  mockConfig: DeepMocked<ConfigService>;
}> {
  let app: INestApplication;

  const moduleBuilder = Test.createTestingModule({
    imports: [await AppModule.register({ IS_GET_CONTEXT: true })],
    providers: [
      {
        provide: ConfigService,
        useValue: createMock<ConfigService>(),
      },
    ],
  });

  moduleBuilder.overrideProvider(LicenseTermsService).useValue({
    getLicenseTerms: jest.fn().mockResolvedValue(true),
    getLicenseTermsInstance: jest.fn().mockResolvedValue(true),
  });

  const moduleRef = await moduleBuilder.compile();

  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter(moduleRef.get(Logger)));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.init();
  setDataSources(app);

  return { app, mockConfig: moduleRef.get(ConfigService) };
}

export function authHeaderForUser(user: User, organizationId?: string, isPasswordLogin = true): string {
  const configService = new ConfigService();
  const jwtService = new JwtService({
    secret: configService.get<string>('SECRET_KEY_BASE'),
  });
  const authPayload = {
    username: user.id,
    sub: user.email,
    organizationId: organizationId || user.defaultOrganizationId,
    isPasswordLogin,
  };
  const authToken = jwtService.sign(authPayload);
  return `Bearer ${authToken}`;
}

// Store a reference to the default DataSource once it's available
let _defaultDataSource: TypeOrmDataSource;
let _tooljetDbDataSource: TypeOrmDataSource;

export function setDataSources(nestApp: INestApplication) {
  _defaultDataSource = nestApp.get(getDataSourceToken('default')) as TypeOrmDataSource;
  try {
    _tooljetDbDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('tooljetDb'));
  } catch {
    // tooljetDb connection may not exist in all test configurations
  }
}

export function getDefaultDataSource(): TypeOrmDataSource {
  if (!_defaultDataSource) {
    throw new Error('DataSource not initialized. Call setDataSources(app) in beforeAll.');
  }
  return _defaultDataSource;
}

export async function clearDB() {
  if (process.env.NODE_ENV !== 'test') return;
  await dropTooljetDbTables();

  const ds = getDefaultDataSource();
  if (!ds.isInitialized) await ds.initialize();

  // Legacy tables removed from DB but still have entity metadata registered
  const skippedTables = [
    'app_group_permissions',
    'data_source_group_permissions',
    'group_permissions',
    'user_group_permissions',
  ];

  const entities = ds.entityMetadatas;
  for (const entity of entities) {
    if (skippedTables.includes(entity.tableName)) continue;

    const repository = ds.getRepository(entity.name);
    if (entity.tableName !== 'instance_settings') {
      try {
        await repository.query(`TRUNCATE ${entity.tableName} RESTART IDENTITY CASCADE;`);
      } catch {
        // Table may not exist in test DB — skip
      }
    } else {
      await repository.query(`UPDATE ${entity.tableName} SET value='true' WHERE key='ALLOW_PERSONAL_WORKSPACE';`);
    }
  }
}

async function dropTooljetDbTables() {
  const ds = getDefaultDataSource();

  const internalTables = (await ds.manager.find(InternalTable, { select: ['id'] })) as InternalTable[];

  if (_tooljetDbDataSource) {
    for (const table of internalTables) {
      await _tooljetDbDataSource.query(`DROP TABLE IF EXISTS "${table.id}" CASCADE`);
    }
  }
}

export async function createApplication(
  nestApp,
  { name, user, isPublic, slug, type = 'front-end' }: any,
  shouldCreateEnvs = true
) {
  let appRepository: Repository<App>;
  appRepository = getDefaultDataSource().getRepository(App);

  user = user || (await (await createUser(nestApp, {})).user);

  if (shouldCreateEnvs) {
    await createAppEnvironments(nestApp, user.organizationId);
  }

  const newApp = await appRepository.save(
    appRepository.create({
      name,
      user,
      slug,
      type,
      isPublic: isPublic || false,
      organizationId: user.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  return newApp;
}

/**
 * @deprecated This function is not implemented - LibraryAppCreationService does not exist in current codebase.
 * If you need to import apps from templates, implement the service first.
 */
export async function importAppFromTemplates(_nestApp, _user, _identifier) {
  throw new Error('importAppFromTemplates is not implemented - LibraryAppCreationService does not exist in current codebase');
}

export async function createApplicationVersion(
  nestApp,
  application,
  { name = 'v0', definition = null, currentEnvironmentId = null } = {}
) {
  let appVersionsRepository: Repository<AppVersion>;
  let appEnvironmentsRepository: Repository<AppEnvironment>;
  appVersionsRepository = getDefaultDataSource().getRepository(AppVersion);
  appEnvironmentsRepository = getDefaultDataSource().getRepository(AppEnvironment);

  const environments = await appEnvironmentsRepository.find({
    where: {
      organizationId: application.organizationId,
    },
  });

  const envId = currentEnvironmentId
    ? currentEnvironmentId
    : defaultAppEnvironments.length > 1
      ? environments.find((env) => env.priority === 1)?.id
      : environments[0].id;

  return await appVersionsRepository.save(
    appVersionsRepository.create({
      appId: application.id,
      name: name + Date.now(),
      currentEnvironmentId: envId,
      definition,
    })
  );
}
export async function getAllEnvironments(nestApp, organizationId): Promise<AppEnvironment[]> {
  let appEnvironmentRepository: Repository<AppEnvironment>;
  appEnvironmentRepository = getDefaultDataSource().getRepository(AppEnvironment);

  return await appEnvironmentRepository.find({
    where: {
      organizationId,
    },
    order: {
      priority: 'ASC',
    },
  });
}

export async function createAppEnvironments(nestApp, organizationId): Promise<AppEnvironment[]> {
  let appEnvironmentRepository: Repository<AppEnvironment>;
  appEnvironmentRepository = getDefaultDataSource().getRepository(AppEnvironment);

  return await Promise.all(
    defaultAppEnvironments.map(async (env) => {
      return await appEnvironmentRepository.save(
        appEnvironmentRepository.create({
          organizationId,
          name: env.name,
          priority: env.priority,
          isDefault: env.isDefault,
        })
      );
    })
  );
}

export async function createUser(
  nestApp,
  {
    firstName,
    lastName,
    email,
    groups,
    organization,
    userType = 'workspace',
    status,
    invitationToken,
    formLoginStatus = true,
    organizationName = `${email}'s workspace`,
    ssoConfigs = [],
    enableSignUp = false,
    userStatus = 'active',
  }: {
    firstName?: string;
    lastName?: string;
    email?: string;
    groups?: Array<string>;
    organization?: Organization;
    status?: string;
    userType?: string;
    invitationToken?: string;
    formLoginStatus?: boolean;
    organizationName?: string;
    ssoConfigs?: Array<any>;
    enableSignUp?: boolean;
    userStatus?: string;
  },
  existingUser?: User
) {
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let organizationUsersRepository: Repository<OrganizationUser>;

  userRepository = getDefaultDataSource().getRepository(User);
  organizationRepository = getDefaultDataSource().getRepository(Organization);
  organizationUsersRepository = getDefaultDataSource().getRepository(OrganizationUser);

  organization =
    organization ||
    (await organizationRepository.save(
      organizationRepository.create({
        name: organizationName,
        enableSignUp,
        createdAt: new Date(),
        updatedAt: new Date(),
        ssoConfigs: [
          {
            sso: 'form',
            enabled: formLoginStatus,
            configScope: 'organization',
          },
          ...ssoConfigs,
        ],
      })
    ));

  let user: User;

  if (!existingUser) {
    user = await userRepository.save(
      userRepository.create({
        firstName: firstName || 'test',
        lastName: lastName || 'test',
        email: email || 'dev@tooljet.io',
        password: 'password',
        userType,
        status: invitationToken ? 'invited' : userStatus,
        invitationToken,
        defaultOrganizationId: organization.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  } else {
    user = existingUser;
  }
  user.organizationId = organization.id;

  const orgUser = await organizationUsersRepository.save(
    organizationUsersRepository.create({
      user: user,
      organization,
      invitationToken: status === 'invited' ? uuidv4() : null,
      status: status || 'active',
      role: 'all_users',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  await maybeCreateDefaultGroupPermissions(nestApp, user.organizationId);
  await createUserGroupPermissions(
    nestApp,
    user,
    groups || ['end-user', 'admin'] // default groups
  );

  return { organization, user, orgUser };
}

export async function createUserGroupPermissions(nestApp, user, groups) {
  const ds: TypeOrmDataSource = nestApp.get(getDataSourceToken('default')) as TypeOrmDataSource;
  const groupPermissionsRepository = ds.getRepository(GroupPermissions);
  const groupUsersRepository = ds.getRepository(GroupUsers);

  let groupUserEntries = [];

  for (const group of groups) {
    // Map old group names to new ones
    const groupName = group === 'all_users' ? 'end-user' : group;

    let groupPermission: GroupPermissions;

    if (groupName === 'admin' || groupName === 'end-user' || groupName === 'builder') {
      groupPermission = await groupPermissionsRepository.findOneOrFail({
        where: {
          organizationId: user.organizationId,
          name: groupName,
        },
      });
    } else {
      groupPermission =
        (await groupPermissionsRepository.findOne({
          where: {
            organizationId: user.organizationId,
            name: groupName,
          },
        })) ||
        groupPermissionsRepository.create({
          organizationId: user.organizationId,
          name: groupName,
          type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
        });
      await groupPermissionsRepository.save(groupPermission);
    }

    const groupUser = groupUsersRepository.create({
      groupId: groupPermission.id,
      userId: user.id,
    });
    await groupUsersRepository.save(groupUser);
    groupUserEntries.push(groupUser);
  }

  return groupUserEntries;
}

export async function createGroupPermission(nestApp, params) {
  const ds: TypeOrmDataSource = nestApp.get(getDataSourceToken('default')) as TypeOrmDataSource;
  const groupPermissionsRepository = ds.getRepository(GroupPermissions);
  // Map old property names to new ones
  const mappedParams = { ...params };
  if (mappedParams.group) {
    mappedParams.name = mappedParams.group === 'all_users' ? 'end-user' : mappedParams.group;
    delete mappedParams.group;
  }
  if (!mappedParams.type) {
    mappedParams.type = GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP;
  }
  // Ensure organizationId is set explicitly when organization entity is passed
  if (mappedParams.organization && !mappedParams.organizationId) {
    mappedParams.organizationId = mappedParams.organization.id;
    delete mappedParams.organization;
  }
  let groupPermission = groupPermissionsRepository.create(mappedParams);
  await groupPermissionsRepository.save(groupPermission);

  return groupPermission;
}

/**
 * Creates app-level permissions for a group using the new granular permissions system.
 *
 * The old system used `app_group_permissions` with `read`, `update`, `delete` flags.
 * The new system uses `granular_permissions` -> `apps_group_permissions` -> `group_apps`.
 *
 * This function:
 * 1. Finds or creates a GranularPermission of type APP for the given group
 * 2. Finds or creates an AppsGroupPermissions linked to it
 * 3. Creates a GroupApps entry linking the specific app to the permission
 *
 * @param nestApp - The NestJS application instance
 * @param application - The App entity
 * @param groupId - The GroupPermissions id
 * @param permissions - { read?: boolean, update?: boolean, delete?: boolean }
 */
export async function createAppGroupPermission(nestApp, application, groupId, permissions: { read?: boolean; update?: boolean; delete?: boolean }) {
  const ds: TypeOrmDataSource = nestApp.get(getDataSourceToken('default')) as TypeOrmDataSource;
  const granularRepo = ds.getRepository(GranularPermissions);
  const appsGroupRepo = ds.getRepository(AppsGroupPermissions);
  const groupAppsRepo = ds.getRepository(GroupApps);

  // Find or create a granular permission for APP type on this group
  let granular = await granularRepo.findOne({
    where: { groupId, type: ResourceType.APP },
  });

  if (!granular) {
    granular = granularRepo.create({
      groupId,
      name: 'Apps',
      type: ResourceType.APP,
      isAll: false,
    });
    granular = await granularRepo.save(granular);
  }

  // Find or create apps group permissions for the granular permission
  let appsPerm = await appsGroupRepo.findOne({
    where: { granularPermissionId: granular.id },
  });

  if (!appsPerm) {
    appsPerm = appsGroupRepo.create({
      granularPermissionId: granular.id,
      appType: APP_TYPES.FRONT_END,
      canEdit: permissions.update || false,
      canView: permissions.read || false,
      hideFromDashboard: false,
    });
    appsPerm = await appsGroupRepo.save(appsPerm);
  } else {
    // Update existing permissions
    await appsGroupRepo.update(appsPerm.id, {
      canEdit: permissions.update || appsPerm.canEdit,
      canView: permissions.read || appsPerm.canView,
    });
    appsPerm = await appsGroupRepo.findOne({ where: { id: appsPerm.id } });
  }

  // Create a GroupApps entry linking the specific app
  const existingGroupApp = await groupAppsRepo.findOne({
    where: { appId: application.id, appsGroupPermissionsId: appsPerm.id },
  });

  if (!existingGroupApp) {
    const groupApp = groupAppsRepo.create({
      appId: application.id,
      appsGroupPermissionsId: appsPerm.id,
    });
    await groupAppsRepo.save(groupApp);
  }
}

/**
 * Creates data-source-level permissions for a group using the new granular permissions system.
 *
 * @param nestApp - The NestJS application instance
 * @param dataSourceId - The DataSource id (not used for granular perms, but kept for API compat)
 * @param groupId - The GroupPermissions id
 * @param permissions - { read?: boolean, update?: boolean, delete?: boolean }
 */
export async function createDatasourceGroupPermission(nestApp, dataSourceId, groupId, permissions: { read?: boolean; update?: boolean; delete?: boolean }) {
  const ds: TypeOrmDataSource = nestApp.get(getDataSourceToken('default')) as TypeOrmDataSource;
  const granularRepo = ds.getRepository(GranularPermissions);
  const dsGroupRepo = ds.getRepository(DataSourcesGroupPermissions);

  // Find or create a granular permission for DATA_SOURCE type on this group
  let granular = await granularRepo.findOne({
    where: { groupId, type: ResourceType.DATA_SOURCE },
  });

  if (!granular) {
    granular = granularRepo.create({
      groupId,
      name: 'Data Sources',
      type: ResourceType.DATA_SOURCE,
      isAll: false,
    });
    granular = await granularRepo.save(granular);
  }

  // Find or create data sources group permissions for the granular permission
  let dsPerm = await dsGroupRepo.findOne({
    where: { granularPermissionId: granular.id },
  });

  if (!dsPerm) {
    dsPerm = dsGroupRepo.create({
      granularPermissionId: granular.id,
      canConfigure: permissions.update || false,
      canUse: permissions.read || false,
    });
    await dsGroupRepo.save(dsPerm);
  } else {
    await dsGroupRepo.update(dsPerm.id, {
      canConfigure: permissions.update || dsPerm.canConfigure,
      canUse: permissions.read || dsPerm.canUse,
    });
  }
}

export async function maybeCreateDefaultGroupPermissions(nestApp, organizationId) {
  const ds: TypeOrmDataSource = nestApp.get(getDataSourceToken('default')) as TypeOrmDataSource;
  const groupPermissionsRepository = ds.getRepository(GroupPermissions);

  const defaultGroups = [
    { name: 'admin', isAdmin: true },
    { name: 'end-user', isAdmin: false },
  ];

  for (let { name, isAdmin } of defaultGroups) {
    const existing = await groupPermissionsRepository.find({
      where: {
        organizationId: organizationId,
        name: name,
      },
    });

    if (existing.length == 0) {
      const groupPermission = groupPermissionsRepository.create({
        organizationId: organizationId,
        name: name,
        type: GROUP_PERMISSIONS_TYPE.DEFAULT,
        appCreate: isAdmin,
        appDelete: isAdmin,
        folderCRUD: isAdmin,
        orgConstantCRUD: isAdmin,
        dataSourceCreate: isAdmin,
        dataSourceDelete: isAdmin,
        workflowCreate: isAdmin,
        workflowDelete: isAdmin,
      });
      const savedGroup = await groupPermissionsRepository.save(groupPermission);

      // Seed granular permissions for apps, data sources, and workflows
      const granularRepo = ds.getRepository(GranularPermissions);
      const appsGroupRepo = ds.getRepository(AppsGroupPermissions);

      for (const resourceType of [ResourceType.APP, ResourceType.DATA_SOURCE, ResourceType.WORKFLOWS]) {
        const granular = granularRepo.create({
          groupId: savedGroup.id,
          name: resourceType === ResourceType.APP ? 'Apps' : resourceType === ResourceType.DATA_SOURCE ? 'Data Sources' : 'Workflows',
          type: resourceType,
          isAll: isAdmin,
        });
        const savedGranular = await granularRepo.save(granular);

        // Create apps group permissions for each app type
        if (resourceType === ResourceType.APP) {
          const appsPerm = appsGroupRepo.create({
            granularPermissionId: savedGranular.id,
            appType: APP_TYPES.FRONT_END,
            canEdit: isAdmin,
            canView: true,
            hideFromDashboard: false,
          });
          await appsGroupRepo.save(appsPerm);
        }
      }
    }
  }
}

export async function addEndUserGroupToUser(nestApp, user) {
  const ds: TypeOrmDataSource = nestApp.get(getDataSourceToken('default')) as TypeOrmDataSource;
  const groupPermissionsRepository = ds.getRepository(GroupPermissions);
  const groupUsersRepository = ds.getRepository(GroupUsers);

  const endUserGroup = await groupPermissionsRepository.findOneOrFail({
    where: {
      organizationId: user.organizationId,
      name: 'end-user',
    },
  });

  const groupUser = groupUsersRepository.create({
    groupId: endUserGroup.id,
    userId: user.id,
  });
  await groupUsersRepository.save(groupUser);

  return user;
}

// Keep backward-compatible alias
export const addAllUsersGroupToUser = addEndUserGroupToUser;

export async function createDataSource(
  nestApp,
  { appVersion, name, kind, type = 'default', options, environmentId = null }: any
) {
  let dataSourceRepository: Repository<DataSource>;
  dataSourceRepository = getDefaultDataSource().getRepository(DataSource);

  const dataSource = await dataSourceRepository.save(
    dataSourceRepository.create({
      name,
      kind,
      appVersion,
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  environmentId && (await createDataSourceOption(nestApp, { dataSource, environmentId, options }));

  return dataSource;
}

export async function createDataQuery(nestApp, { name = 'defaultquery', dataSource, appVersion, options }: any) {
  let dataQueryRepository: Repository<DataQuery>;
  dataQueryRepository = getDefaultDataSource().getRepository(DataQuery);

  return await dataQueryRepository.save(
    dataQueryRepository.create({
      name,
      options,
      dataSource,
      appVersion,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
}

export async function createDataSourceOption(nestApp, { dataSource, environmentId, options }: any) {
  let dataSourceOptionsRepository: Repository<DataSourceOptions>;
  dataSourceOptionsRepository = getDefaultDataSource().getRepository(DataSourceOptions);

  const dataSourcesService = nestApp.select(DataSourcesModule).get(DataSourcesService);

  return await dataSourceOptionsRepository.save(
    dataSourceOptionsRepository.create({
      options: await dataSourcesService.parseOptionsForCreate(options),
      dataSourceId: dataSource.id,
      environmentId,
    })
  );
}

export async function createFile(nestApp: any) {
  let fileRepository: Repository<File>;
  fileRepository = getDefaultDataSource().getRepository(File);
  const createFileDto = new CreateFileDto();
  createFileDto.filename = 'testfile';
  createFileDto.data = Buffer.from([1, 2, 3, 4]);
  return await fileRepository.save(fileRepository.create(createFileDto));
}

export async function installPlugin(nestApp: any, { name, description, id, version }: any) {
  let pluginRepository: Repository<Plugin>;
  pluginRepository = getDefaultDataSource().getRepository(Plugin);
  const createPluginDto = new CreatePluginDto();
  createPluginDto.id = id;
  createPluginDto.name = name;
  createPluginDto.version = version;
  createPluginDto.description = description;

  const pluginsService = nestApp.select(PluginsModule).get(PluginsService);

  return await pluginRepository.save(pluginsService.install(createPluginDto));
}

/**
 * @deprecated This function is not implemented - ThreadRepository does not exist in current codebase.
 */
export async function createThread(_nestApp, _params: { appId: string; x: number; y: number; userId: string; organizationId: string; appVersionsId: string }) {
  throw new Error('createThread is not implemented - ThreadRepository does not exist in current codebase');
}

export async function setupOrganization(nestApp) {
  const adminUserData = await createUser(nestApp, {
    email: 'admin@tooljet.io',
    groups: ['end-user', 'admin'],
  });
  const adminUser = adminUserData.user;
  const organization = adminUserData.organization;
  const defaultUserData = await createUser(nestApp, {
    email: 'developer@tooljet.io',
    groups: ['end-user'],
    organization,
  });
  const defaultUser = defaultUserData.user;

  const app = await createApplication(nestApp, {
    user: adminUser,
    name: 'sample app',
    isPublic: false,
  });

  return { adminUser, defaultUser, app };
}

export const generateRedirectUrl = async (
  email: string,
  current_organization?: Organization,
  isOrgInvitation?: boolean,
  isSSO = true
) => {
  const ds = getDefaultDataSource();
  const user = await ds.manager.findOneOrFail(User, { where: { email: email } });

  const organizationToken = user.organizationUsers?.find(
    (ou) => ou.organizationId === current_organization?.id
  )?.invitationToken;

  return `${process.env['TOOLJET_HOST']}${isOrgInvitation ? `/organization-invitations/${organizationToken}` : `/invitations/${user.invitationToken}`
    }${organizationToken
      ? `${!isOrgInvitation ? `/workspaces/${organizationToken}` : ''}?oid=${current_organization?.id}&`
      : isSSO
        ? '?'
        : ''
    }${isSSO ? 'source=sso' : ''}`;
};

export const createSSOMockConfig = (mockConfig) => {
  jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
    switch (key) {
      case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
        return 'google-client-id';
      case 'SSO_GIT_OAUTH2_CLIENT_ID':
        return 'git-client-id';
      case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
        return 'git-secret';
      case 'SSO_ACCEPTED_DOMAINS':
        return 'tooljet.io,tooljet.com';
      default:
        return process.env[key];
    }
  });
};

export const verifyInviteToken = async (app: INestApplication, user: User, verifyForSignup = false) => {
  let organizationUsersRepository: Repository<OrganizationUser>;
  organizationUsersRepository = app.get('OrganizationUserRepository');

  const { invitationToken } = user;
  const { invitationToken: orgInviteToken } = await organizationUsersRepository.findOneOrFail({
    where: { userId: user.id },
  });
  const response = await request(app.getHttpServer()).get(
    `/api/onboarding/verify-invite-token?token=${invitationToken}${!verifyForSignup && orgInviteToken ? `&organizationToken=${orgInviteToken}` : ''
    }`
  );
  const {
    body: { onboarding_details },
    status,
  } = response;

  expect(status).toBe(200);
  expect(Object.keys(onboarding_details)).toEqual(['password', 'questions']);
  await user.reload();
  expect(user.status).toBe('verified');
  return response;
};

export const setUpAccountFromToken = async (app: INestApplication, user: User, org: Organization, payload) => {
  const response = await request(app.getHttpServer()).post('/api/onboarding/setup-account-from-token').send(payload);
  const { status } = response;
  expect(status).toBe(201);

  const { email, first_name, last_name, current_organization_id } = response.body;

  expect(email).toEqual(user.email);
  expect(first_name).toEqual(user.firstName);
  expect(last_name).toEqual(user.lastName);
  expect(current_organization_id).toBe(org.id);
  await user.reload();
  expect(user.status).toBe('active');
  expect(user.defaultOrganizationId).toBe(org.id);
};

export const getPathFromUrl = (url) => {
  return url.split('?')[0];
};

export const createFirstUser = async (app: INestApplication) => {
  let userRepository: Repository<User> = app.get('UserRepository');

  await request(app.getHttpServer())
    .post('/api/onboarding/setup-super-admin')
    .send({ email: 'firstuser@tooljet.com', name: 'Admin', password: 'password', workspace: 'tooljet', workspaceName: 'tooljet' });

  return await userRepository.findOneOrFail({
    where: { email: 'firstuser@tooljet.com' },
    relations: ['organizationUsers'],
  });
};

export const generateAppDefaults = async (
  app: INestApplication,
  user: any,
  {
    isQueryNeeded = true,
    isDataSourceNeeded = true,
    isAppPublic = false,
    dsKind = 'restapi',
    dsOptions = [{}],
    name = 'name',
  }
) => {
  const application = await createApplication(
    app,
    {
      name,
      user: user,
      isPublic: isAppPublic,
    },
    false
  );

  const appEnvironments = await createAppEnvironments(app, user.organizationId);
  const appVersion = await createApplicationVersion(app, application);

  let dataQuery: any;
  let dataSource: any;
  if (isDataSourceNeeded) {
    dataSource = await createDataSource(app, {
      name: 'name',
      kind: dsKind,
      appVersion,
    });

    await Promise.all(
      appEnvironments.map(async (env) => {
        await createDataSourceOption(app, { dataSource, environmentId: env.id, options: dsOptions });
      })
    );

    if (isQueryNeeded) {
      dataQuery = await createDataQuery(app, {
        dataSource,
        appVersion,
        options: {
          method: 'get',
          url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
          url_params: [],
          headers: [],
          body: [],
        },
      });
    }
  }

  return { application, appVersion, dataSource, dataQuery, appEnvironments };
};

export const getAppWithAllDetails = async (id: string) => {
  const ds = getDefaultDataSource();
  const app = await ds.manager
    .createQueryBuilder(App, 'app')
    .where('app.id = :id', { id })
    .innerJoinAndSelect('app.appVersions', 'versions')
    .leftJoinAndSelect('versions.dataSources', 'dataSources')
    .leftJoinAndSelect('versions.dataQueries', 'dataQueries')
    .getOneOrFail();

  const dataQueries = [];
  const dataSources = [];
  app.appVersions.map((version) => {
    dataSources.push(...version.dataSources);
    dataQueries.push(...version.dataQueries);
    version.dataSources = undefined;
    version.dataQueries = undefined;
  });

  app['dataQueries'] = dataQueries;
  app['dataSources'] = dataSources;

  return app;
};

export const authenticateUser = async (
  app: INestApplication,
  email = 'admin@tooljet.io',
  password = 'password',
  organization_id = null
) => {
  const sessionResponse = await request
    .agent(app.getHttpServer())
    .post(`/api/authenticate${organization_id ? `/${organization_id}` : ''}`)
    .send({ email, password })
    .expect(201);

  return { user: sessionResponse.body, tokenCookie: sessionResponse.headers['set-cookie'] };
};

export const logoutUser = async (app: INestApplication, tokenCookie: any, organization_id: string) => {
  return await request
    .agent(app.getHttpServer())
    .get('/api/session/logout')
    .set('tj-workspace-id', organization_id)
    .set('Cookie', tokenCookie)
    .expect(200);
};

export const getAppEnvironment = async (id: string, priority: number) => {
  const ds = getDefaultDataSource();
  return await ds.manager.findOneOrFail(AppEnvironment, {
    where: { ...(id && { id }), ...(priority && { priority }) },
  });
};

export const getWorkflowWebhookApiToken = async (appId: string) => {
  const ds = getDefaultDataSource();
  const app = await ds.manager.createQueryBuilder(App, 'app').where('app.id = :id', { id: appId }).getOneOrFail();
  return app?.workflowApiToken ?? '';
};

export const enableWebhookForWorkflows = async (workflowId: string, status = true) => {
  const ds = getDefaultDataSource();
  await ds.manager
    .createQueryBuilder()
    .update(App)
    .set({ workflowEnabled: status, workflowApiToken: uuidv4() })
    .where('id = :id', { id: workflowId })
    .execute();
};

export const triggerWorkflowViaWebhook = async (
  app: INestApplication,
  apiToken: string,
  workflowId: string,
  environment = 'development',
  bodyJson: any = {}
) => {
  return await request(app.getHttpServer())
    .post(`/api/v2/webhooks/workflows/${workflowId}/trigger?environment=${environment}`)
    .set('Authorization', `Bearer ${apiToken}`)
    .set('Content-Type', 'application/json')
    .send(bodyJson);
};

export const enableWorkflowStatus = async (
  app: INestApplication,
  workflowId: string,
  orgId: string,
  tokenCookie: any,
  isMaintenanceOn = true
) => {
  return await request(app.getHttpServer())
    .put(`/api/apps/${workflowId}`)
    .set('tj-workspace-id', orgId)
    .set('Cookie', tokenCookie)
    .send({
      app: {
        is_maintenance_on: isMaintenanceOn,
      },
    });
};

export async function createNestAppInstanceWithServiceMocks({ shouldMockLicenseService = false }): Promise<{
  app: INestApplication;
  licenseServiceMock?: DeepMocked<LicenseService>;
  configServiceMock?: DeepMocked<ConfigService>;
}> {
  let app: INestApplication;

  const moduleRef = await Test.createTestingModule({
    imports: [await AppModule.register({ IS_GET_CONTEXT: true })],
    providers: [
      {
        ...(shouldMockLicenseService && {
          provide: LicenseService,
          useValue: createMock<LicenseService>(),
        }),
      },
    ],
  }).compile();

  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter(moduleRef.get(Logger)));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });
  await app.init();
  setDataSources(app);

  return {
    app,
    ...(shouldMockLicenseService && { licenseServiceMock: moduleRef.get(LicenseService) }),
  };
}
