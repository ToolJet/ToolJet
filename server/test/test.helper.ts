/* eslint-disable prefer-const */
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getConnection, getManager, Repository } from 'typeorm';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';
import { App } from 'src/entities/app.entity';
import { INestApplication, ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@modules/app/module';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { AllExceptionsFilter } from '@modules/app/filters/all-exceptions-filter';
import { Logger } from 'nestjs-pino';
import { WsAdapter } from '@nestjs/platform-ws';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { v4 as uuidv4 } from 'uuid';
import * as request from 'supertest';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';
import * as cookieParser from 'cookie-parser';
import { LicenseService } from '@modules/licensing/service';
import { InternalTable } from '@entities/internal_table.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE, ResourceType } from '@modules/group-permissions/constants';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { GroupApps } from '@entities/group_apps.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { DataSourcesGroupPermissions } from '@entities/data_sources_group_permissions.entity';
import { GroupDataSources } from '@entities/group_data_source.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { USER_ROLE } from '@modules/group-permissions/constants';

export async function createNestAppInstance(): Promise<INestApplication> {
  let app: INestApplication;

  const moduleRef = await Test.createTestingModule({
    imports: [await AppModule.register({ IS_GET_CONTEXT: false })],
    providers: [],
  }).compile();

  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });
  await app.init();
  const server = app.getHttpServer();
  const router = server._events.request._router;

  if (router) {
    console.log('Registered routes:');
    router.stack.forEach((layer) => {
      if (layer.route) {
        console.log(`${Object.keys(layer.route.methods)} ${layer.route.path}`);
      }
    });
  }

  // Alternative: For NestJS routes
  const routes = server._events.request._router?.stack
    .filter((layer) => layer.route)
    .map((layer) => {
      const methods = Object.keys(layer.route.methods).join(', ');
      return `${methods.toUpperCase()} ${layer.route.path}`;
    });
  console.log('Available routes:', routes);

  return app;
}

export async function createNestAppInstanceWithEnvMock(): Promise<{
  app: INestApplication;
  mockConfig: DeepMocked<ConfigService>;
}> {
  let app: INestApplication;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    providers: [
      {
        provide: ConfigService,
        useValue: createMock<ConfigService>(),
      },
    ],
  }).compile();

  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.init();

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

export async function clearDB() {
  // if (process.env.NODE_ENV !== 'test') return;
  // await dropTooljetDbTables();
  // const entities = getConnection().entityMetadatas;
  // for (const entity of entities) {
  //   const repository = getConnection().getRepository(entity.name);
  //   if (entity.tableName !== 'instance_settings') {
  //     await repository.query(`TRUNCATE ${entity.tableName} RESTART IDENTITY CASCADE;`);
  //   } else {
  //     await repository.query(`UPDATE ${entity.tableName} SET value='true' WHERE key='ALLOW_PERSONAL_WORKSPACE';`);
  //   }
  // }
}

async function dropTooljetDbTables() {
  const connection = getConnection();
  const tooljetDbConnection = getConnection('tooljetDb');

  const internalTables = (await connection.manager.find(InternalTable, { select: ['id'] })) as InternalTable[];

  for (const table of internalTables) {
    await tooljetDbConnection.query(`DROP TABLE IF EXISTS "${table.id}" CASCADE`);
  }
}

// export async function importAppFromTemplates(nestApp, user, identifier) {
//   const service = nestApp.select(AppsModule).get(LibraryAppCreationService);

//   return service.perform(user, identifier);
// }

export async function createApplicationVersion(
  nestApp,
  application,
  { name = 'v0', definition = null, currentEnvironmentId = null } = {}
) {
  let appVersionsRepository: Repository<AppVersion>;
  let appEnvironmentsRepository: Repository<AppEnvironment>;
  appVersionsRepository = nestApp.get('AppVersionRepository');
  appEnvironmentsRepository = nestApp.get('AppEnvironmentRepository');

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
  appEnvironmentRepository = nestApp.get('AppEnvironmentRepository');

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
  appEnvironmentRepository = nestApp.get('AppEnvironmentRepository');

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
// export async function createDataSource(
//   nestApp,
//   { appVersion, name, kind, type = 'default', options, environmentId = null }: any
// ) {
//   let dataSourceRepository: Repository<DataSource>;
//   dataSourceRepository = nestApp.get('DataSourceRepository');

//   const dataSource = await dataSourceRepository.save(
//     dataSourceRepository.create({
//       name,
//       kind,
//       appVersion,
//       type,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     })
//   );

//   environmentId && (await createDataSourceOption(nestApp, { dataSource, environmentId, options }));

//   return dataSource;
// }

export async function createDataQuery(nestApp, { name = 'defaultquery', dataSource, appVersion, options }: any) {
  let dataQueryRepository: Repository<DataQuery>;
  dataQueryRepository = nestApp.get('DataQueryRepository');

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

// export async function createDataSourceOption(nestApp, { dataSource, environmentId, options }: any) {
//   let dataSourceOptionsRepository: Repository<DataSourceOptions>;
//   dataSourceOptionsRepository = nestApp.get('DataSourceOptionsRepository');

//   const dataSourcesService = nestApp.select(DataSourcesModule).get(DataSourcesService);

//   return await dataSourceOptionsRepository.save(
//     dataSourceOptionsRepository.create({
//       options: await dataSourcesService.parseOptionsForCreate(options),
//       dataSourceId: dataSource.id,
//       environmentId,
//     })
//   );
// }

// export async function createFile(nestApp: any) {
//   let fileRepository: Repository<File>;
//   fileRepository = nestApp.get('FileRepository');
//   const createFileDto = new CreateFileDto();
//   createFileDto.filename = 'testfile';
//   createFileDto.data = Buffer.from([1, 2, 3, 4]);
//   return await fileRepository.save(fileRepository.create(createFileDto));
// }

// export async function installPlugin(nestApp: any, { name, description, id, version }: any) {
//   let pluginRepository: Repository<Plugin>;
//   pluginRepository = nestApp.get('PluginRepository');
//   const createPluginDto = new CreatePluginDto();
//   createPluginDto.id = id;
//   createPluginDto.name = name;
//   createPluginDto.version = version;
//   createPluginDto.description = description;

//   const pluginsService = nestApp.select(PluginsModule).get(PluginsService);

//   return await pluginRepository.save(pluginsService.install(createPluginDto));
// }

// export async function createThread(_nestApp, { appId, x, y, userId, organizationId, appVersionsId }: any) {
//   const threadRepository = new ThreadRepository();

//   return await threadRepository.createThread(
//     {
//       appId,
//       x,
//       y,
//       isResolved: false,
//       organizationId,
//       appVersionsId,
//       pageId: 'placeholder',
//     },
//     userId,
//     organizationId
//   );
// }

export async function setupOrganization(nestApp) {
  const adminUserData = await createUser(nestApp, {
    email: 'admin@tooljet.io',
    groups: ['admin'],
  });
  const adminUser = adminUserData.user;
  const organization = adminUserData.organization;
  const defaultUserData = await createUser(nestApp, {
    email: 'developer@tooljet.io',
    groups: [USER_ROLE.BUILDER],
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
  const manager = getManager();
  const user = await manager.findOneOrFail(User, { where: { email: email } });

  const organizationToken = user.organizationUsers?.find(
    (ou) => ou.organizationId === current_organization?.id
  )?.invitationToken;

  return `${process.env['TOOLJET_HOST']}${
    isOrgInvitation ? `/organization-invitations/${organizationToken}` : `/invitations/${user.invitationToken}`
  }${
    organizationToken
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
    `/api/onboarding/verify-invite-token?token=${invitationToken}${
      !verifyForSignup && orgInviteToken ? `&organizationToken=${orgInviteToken}` : ''
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
  const response = await request(app.getHttpServer()).post('/api/setup-account-from-token').send(payload);
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
    .post('/api/setup-admin')
    .send({ email: 'firstuser@tooljet.com', name: 'Admin', password: 'password', workspace: 'tooljet' });

  return await userRepository.findOneOrFail({
    where: { email: 'firstuser@tooljet.com' },
    relations: ['organizationUsers'],
  });
};

// export const generateAppDefaults = async (
//   app: INestApplication,
//   user: any,
//   {
//     isQueryNeeded = true,
//     isDataSourceNeeded = true,
//     isAppPublic = false,
//     dsKind = 'restapi',
//     dsOptions = [{}],
//     name = 'name',
//   }
// ) => {
//   const application = await createApplication(
//     app,
//     {
//       name,
//       user: user,
//       isPublic: isAppPublic,
//     },
//     false
//   );

//   const appEnvironments = await createAppEnvironments(app, user.organizationId);
//   const appVersion = await createApplicationVersion(app, application);

//   let dataQuery: any;
//   let dataSource: any;
//   if (isDataSourceNeeded) {
//     dataSource = await createDataSource(app, {
//       name: 'name',
//       kind: dsKind,
//       appVersion,
//     });

//     await Promise.all(
//       appEnvironments.map(async (env) => {
//         await createDataSourceOption(app, { dataSource, environmentId: env.id, options: dsOptions });
//       })
//     );

//     if (isQueryNeeded) {
//       dataQuery = await createDataQuery(app, {
//         dataSource,
//         appVersion,
//         options: {
//           method: 'get',
//           url: 'https://api.github.com/repos/tooljet/tooljet/stargazers',
//           url_params: [],
//           headers: [],
//           body: [],
//         },
//       });
//     }
//   }

//   return { application, appVersion, dataSource, dataQuery, appEnvironments };
// };

export const getAppWithAllDetails = async (id: string) => {
  const app = await getManager()
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
    .get('/api/logout')
    .set('tj-workspace-id', organization_id)
    .set('Cookie', tokenCookie)
    .expect(200);
};

export const getAppEnvironment = async (id: string, priority: number) => {
  return await getManager().findOneOrFail(AppEnvironment, {
    where: { ...(id && { id }), ...(priority && { priority }) },
  });
};

export const getWorkflowWebhookApiToken = async (appId: string) => {
  const app = await getManager().createQueryBuilder(App, 'app').where('app.id = :id', { id: appId }).getOneOrFail();
  return app?.workflowApiToken ?? '';
};

export const enableWebhookForWorkflows = async (workflowId: string, status = true) => {
  await getManager()
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
    imports: [AppModule],
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

  return {
    app,
    ...(shouldMockLicenseService && { licenseServiceMock: moduleRef.get(LicenseService) }),
  };
}

export async function createApplication(
  nestApp,
  { name, user, isPublic, slug, type = 'front-end' }: any,
  shouldCreateEnvs = true
) {
  let appRepository: Repository<App>;
  appRepository = nestApp.get('AppRepository');

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

  await maybeCreateAdminAppGroupPermissions(nestApp, newApp);
  await maybeCreateAllUsersAppGroupPermissions(nestApp, newApp);

  return newApp;
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

  userRepository = nestApp.get('UserRepository');
  organizationRepository = nestApp.get('OrganizationRepository');
  organizationUsersRepository = nestApp.get('OrganizationUserRepository');

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
      role: USER_ROLE.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  await maybeCreateDefaultGroupPermissions(nestApp, user.organizationId);
  await createUserGroupPermissions(
    nestApp,
    user,
    groups || [USER_ROLE.ADMIN] // default groups
  );

  return { organization, user, orgUser };
}

export async function createUserGroupPermissions(nestApp, user, groups) {
  const groupPermissionRepository: Repository<GroupPermissions> = nestApp.get('GroupPermissionsRepository');
  const groupUsersRepository: Repository<GroupUsers> = nestApp.get('GroupUsersRepository');

  let userGroupPermissions = [];

  for (const group of groups) {
    let groupPermission: GroupPermissions;

    if (group == USER_ROLE.ADMIN || group == USER_ROLE.BUILDER) {
      groupPermission = await groupPermissionRepository.findOneOrFail({
        where: {
          organizationId: user.organizationId,
          name: group,
        },
      });
    } else {
      groupPermission =
        (await groupPermissionRepository.findOne({
          where: {
            organizationId: user.organizationId,
            name: group,
          },
        })) ||
        groupPermissionRepository.create({
          organizationId: user.organizationId,
          name: group,
          type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
        });
      await groupPermissionRepository.save(groupPermission);
    }

    const groupUser = groupUsersRepository.create({
      groupId: groupPermission.id,
      userId: user.id,
    });
    await groupUsersRepository.save(groupUser);
    userGroupPermissions.push(groupUser);
  }

  return userGroupPermissions;
}

export async function createAppGroupPermission(nestApp, app, groupId, permissions) {
  const granularPermissionsRepository: Repository<GranularPermissions> = nestApp.get('GranularPermissionsRepository');
  const appsGroupPermissionsRepository: Repository<AppsGroupPermissions> = nestApp.get(
    'AppsGroupPermissionsRepository'
  );
  const groupAppsRepository: Repository<GroupApps> = nestApp.get('GroupAppsRepository');

  // Create granular permission for apps
  const granularPermission = await granularPermissionsRepository.save(
    granularPermissionsRepository.create({
      groupId: groupId,
      name: 'Apps',
      type: ResourceType.APP,
      isAll: false,
    })
  );

  // Map old permission format to new format
  const mappedPermissions = {
    canView: permissions.read || false,
    canEdit: permissions.update || false,
    hideFromDashboard: permissions.hideFromDashboard || false,
    appType: permissions.appType || APP_TYPES.FRONT_END,
  };

  // Create apps group permissions
  const appsGroupPermission = await appsGroupPermissionsRepository.save(
    appsGroupPermissionsRepository.create({
      granularPermissionId: granularPermission.id,
      ...mappedPermissions,
    })
  );

  // Create group apps association
  const groupApp = await groupAppsRepository.save(
    groupAppsRepository.create({
      appId: app.id,
      appsGroupPermissionsId: appsGroupPermission.id,
    })
  );

  return { granularPermission, appsGroupPermission, groupApp };
}

export async function createDatasourceGroupPermission(nestApp, dataSourceId, groupId, permissions) {
  const granularPermissionsRepository: Repository<GranularPermissions> = nestApp.get('GranularPermissionsRepository');
  const dataSourcesGroupPermissionsRepository: Repository<DataSourcesGroupPermissions> = nestApp.get(
    'DataSourcesGroupPermissionsRepository'
  );
  const groupDataSourcesRepository: Repository<GroupDataSources> = nestApp.get('GroupDataSourcesRepository');

  // Create granular permission for data sources
  const granularPermission = await granularPermissionsRepository.save(
    granularPermissionsRepository.create({
      groupId: groupId,
      name: 'Data Sources',
      type: ResourceType.DATA_SOURCE,
      isAll: false,
    })
  );

  // Map old permission format to new format
  const mappedPermissions = {
    canUse: permissions.read || permissions.canUse || false,
    canConfigure: permissions.update || permissions.canConfigure || false,
  };

  // Create data sources group permissions
  const dataSourcesGroupPermission = await dataSourcesGroupPermissionsRepository.save(
    dataSourcesGroupPermissionsRepository.create({
      granularPermissionId: granularPermission.id,
      ...mappedPermissions,
    })
  );

  // Create group data sources association
  const groupDataSource = await groupDataSourcesRepository.save(
    groupDataSourcesRepository.create({
      dataSourceId: dataSourceId,
      dataSourcesGroupPermissionsId: dataSourcesGroupPermission.id,
    })
  );

  return { granularPermission, dataSourcesGroupPermission, groupDataSource };
}

export async function createGroupPermission(nestApp, params) {
  const groupPermissionRepository: Repository<GroupPermissions> = nestApp.get('GroupPermissionsRepository');
  let groupPermission = groupPermissionRepository.create({
    type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
    ...params,
  });
  await groupPermissionRepository.save(groupPermission);

  return groupPermission;
}

export async function maybeCreateDefaultGroupPermissions(nestApp, organizationId) {
  const groupPermissionRepository: Repository<GroupPermissions> = nestApp.get('GroupPermissionsRepository');

  const defaultGroups = [
    { name: USER_ROLE.ADMIN, type: GROUP_PERMISSIONS_TYPE.DEFAULT },
    { name: USER_ROLE.BUILDER, type: GROUP_PERMISSIONS_TYPE.DEFAULT },
  ];

  for (let group of defaultGroups) {
    const orgDefaultGroupPermissions = await groupPermissionRepository.find({
      where: {
        organizationId: organizationId,
        name: group.name,
      },
    });

    if (orgDefaultGroupPermissions.length == 0) {
      const groupPermission = groupPermissionRepository.create({
        organizationId: organizationId,
        name: group.name,
        type: group.type,
        appCreate: group.name == 'admin',
        appDelete: group.name == 'admin',
        workflowCreate: group.name == 'admin',
        workflowDelete: group.name == 'admin',
        folderCRUD: group.name == 'admin',
        orgConstantCRUD: group.name == 'admin',
        dataSourceCreate: group.name === 'admin',
        dataSourceDelete: group.name === 'admin',
        appPromote: group.name == 'admin',
        appRelease: group.name == 'admin',
      });
      await groupPermissionRepository.save(groupPermission);
    }
  }
}

export async function maybeCreateAdminAppGroupPermissions(nestApp, app) {
  const groupPermissionRepository: Repository<GroupPermissions> = nestApp.get('GroupPermissionsRepository');
  const granularPermissionsRepository: Repository<GranularPermissions> = nestApp.get('GranularPermissionsRepository');
  const appsGroupPermissionsRepository: Repository<AppsGroupPermissions> = nestApp.get(
    'AppsGroupPermissionsRepository'
  );
  const groupAppsRepository: Repository<GroupApps> = nestApp.get('GroupAppsRepository');

  const orgAdminGroupPermissions = await groupPermissionRepository.findOne({
    where: {
      organizationId: app.organizationId,
      name: 'admin',
    },
  });

  if (orgAdminGroupPermissions) {
    // Check if granular permission already exists
    let granularPermission = await granularPermissionsRepository.findOne({
      where: {
        groupId: orgAdminGroupPermissions.id,
        type: ResourceType.APP,
      },
    });

    if (!granularPermission) {
      granularPermission = await granularPermissionsRepository.save(
        granularPermissionsRepository.create({
          groupId: orgAdminGroupPermissions.id,
          name: 'Apps',
          type: ResourceType.APP,
          isAll: true,
        })
      );
    }

    // Create apps group permissions if not exists
    let appsGroupPermission = await appsGroupPermissionsRepository.findOne({
      where: {
        granularPermissionId: granularPermission.id,
      },
    });

    if (!appsGroupPermission) {
      appsGroupPermission = await appsGroupPermissionsRepository.save(
        appsGroupPermissionsRepository.create({
          granularPermissionId: granularPermission.id,
          canView: true,
          canEdit: true,
          hideFromDashboard: false,
          appType: APP_TYPES.FRONT_END,
        })
      );
    }

    // Create group apps association
    const existingGroupApp = await groupAppsRepository.findOne({
      where: {
        appId: app.id,
        appsGroupPermissionsId: appsGroupPermission.id,
      },
    });

    if (!existingGroupApp) {
      await groupAppsRepository.save(
        groupAppsRepository.create({
          appId: app.id,
          appsGroupPermissionsId: appsGroupPermission.id,
        })
      );
    }
  }
}

export async function maybeCreateAllUsersAppGroupPermissions(nestApp, app) {
  const groupPermissionRepository: Repository<GroupPermissions> = nestApp.get('GroupPermissionsRepository');
  const granularPermissionsRepository: Repository<GranularPermissions> = nestApp.get('GranularPermissionsRepository');
  const appsGroupPermissionsRepository: Repository<AppsGroupPermissions> = nestApp.get(
    'AppsGroupPermissionsRepository'
  );
  const groupAppsRepository: Repository<GroupApps> = nestApp.get('GroupAppsRepository');

  const allUsersGroup = await groupPermissionRepository.findOne({
    where: {
      organizationId: app.organizationId,
      name: USER_ROLE.BUILDER,
    },
  });

  if (allUsersGroup) {
    // Check if granular permission already exists
    let granularPermission = await granularPermissionsRepository.findOne({
      where: {
        groupId: allUsersGroup.id,
        type: ResourceType.APP,
      },
    });

    if (!granularPermission) {
      granularPermission = await granularPermissionsRepository.save(
        granularPermissionsRepository.create({
          groupId: allUsersGroup.id,
          name: 'Apps',
          type: ResourceType.APP,
          isAll: false,
        })
      );
    }

    // Create apps group permissions if not exists
    let appsGroupPermission = await appsGroupPermissionsRepository.findOne({
      where: {
        granularPermissionId: granularPermission.id,
      },
    });

    if (!appsGroupPermission) {
      appsGroupPermission = await appsGroupPermissionsRepository.save(
        appsGroupPermissionsRepository.create({
          granularPermissionId: granularPermission.id,
          canView: false,
          canEdit: false,
          hideFromDashboard: false,
          appType: APP_TYPES.FRONT_END,
        })
      );
    }

    // Create group apps association
    const existingGroupApp = await groupAppsRepository.findOne({
      where: {
        appId: app.id,
        appsGroupPermissionsId: appsGroupPermission.id,
      },
    });

    if (!existingGroupApp) {
      await groupAppsRepository.save(
        groupAppsRepository.create({
          appId: app.id,
          appsGroupPermissionsId: appsGroupPermission.id,
        })
      );
    }
  }
}

// export async function addAllUsersGroupToUser(nestApp, user) {
//   const groupPermissionRepository: Repository<GroupPermissions> = nestApp.get('GroupPermissionsRepository');
//   const groupUsersRepository: Repository<GroupUsers> = nestApp.get('GroupUsersRepository');

//   const orgDefaultGroupPermissions = await groupPermissionRepository.findOneOrFail({
//     where: {
//       organizationId: user.organizationId,
//       name: 'all_users',
//     },
//   });

//   const groupUser = groupUsersRepository.create({
//     groupId: orgDefaultGroupPermissions.id,
//     userId: user.id,
//   });
//   await groupUsersRepository.save(groupUser);

//   return user;
// }
