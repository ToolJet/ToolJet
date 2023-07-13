/* eslint-disable prefer-const */
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getConnection, getManager, Repository } from 'typeorm';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';
import { App } from 'src/entities/app.entity';
import { File } from 'src/entities/file.entity';
import { Plugin } from 'src/entities/plugin.entity';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { PluginsService } from 'src/services/plugins.service';
import { DataSourcesService } from 'src/services/data_sources.service';
import { PluginsModule } from 'src/modules/plugins/plugins.module';
import { DataSourcesModule } from 'src/modules/data_sources/data_sources.module';
import { ThreadRepository } from 'src/repositories/thread.repository';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { AllExceptionsFilter } from 'src/all-exceptions-filter';
import { Logger } from 'nestjs-pino';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppsModule } from 'src/modules/apps/apps.module';
import { LibraryAppCreationService } from '@services/library_app_creation.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { v4 as uuidv4 } from 'uuid';
import { CreateFileDto } from '@dto/create-file.dto';
import { CreatePluginDto } from '@dto/create-plugin.dto';
import * as request from 'supertest';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import * as cookieParser from 'cookie-parser';

export async function createNestAppInstance(): Promise<INestApplication> {
  let app: INestApplication;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    providers: [],
  }).compile();

  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter(moduleRef.get(Logger)));
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

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
  app.useGlobalFilters(new AllExceptionsFilter(moduleRef.get(Logger)));
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
  const entities = getConnection().entityMetadatas;
  for (const entity of entities) {
    const repository = getConnection().getRepository(entity.name);
    await repository.query(`TRUNCATE ${entity.tableName} RESTART IDENTITY CASCADE;`);
  }
}

export async function createApplication(nestApp, { name, user, isPublic, slug }: any, shouldCreateEnvs = true) {
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

export async function importAppFromTemplates(nestApp, user, identifier) {
  const service = nestApp.select(AppsModule).get(LibraryAppCreationService);

  return service.perform(user, identifier);
}

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
      app: application,
      name,
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

export async function createUser(
  nestApp,
  {
    firstName,
    lastName,
    email,
    groups,
    organization,
    status,
    invitationToken,
    formLoginStatus = true,
    organizationName = `${email}'s workspace`,
    ssoConfigs = [],
    enableSignUp = false,
  }: {
    firstName?: string;
    lastName?: string;
    email?: string;
    groups?: Array<string>;
    organization?: Organization;
    status?: string;
    invitationToken?: string;
    formLoginStatus?: boolean;
    organizationName?: string;
    ssoConfigs?: Array<any>;
    enableSignUp?: boolean;
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
        invitationToken,
        defaultOrganizationId: organization.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: invitationToken ? 'invited' : 'active',
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
    groups || ['all_users', 'admin'] // default groups
  );

  return { organization, user, orgUser };
}

export async function createUserGroupPermissions(nestApp, user, groups) {
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get('GroupPermissionRepository');

  const userGroupPermissionRepository: Repository<UserGroupPermission> = nestApp.get('UserGroupPermissionRepository');

  let userGroupPermissions = [];

  for (const group of groups) {
    let groupPermission: GroupPermission;

    if (group == 'admin' || group == 'all_users') {
      groupPermission = await groupPermissionRepository.findOneOrFail({
        where: {
          organizationId: user.organizationId,
          group: group,
        },
      });
    } else {
      groupPermission =
        (await groupPermissionRepository.findOne({
          where: {
            organizationId: user.organizationId,
            group: group,
          },
        })) ||
        groupPermissionRepository.create({
          organizationId: user.organizationId,
          group: group,
        });
      await groupPermissionRepository.save(groupPermission);
    }

    const userGroupPermission = userGroupPermissionRepository.create({
      groupPermissionId: groupPermission.id,
      userId: user.id,
    });
    await userGroupPermissionRepository.save(userGroupPermission);
    userGroupPermissions.push(userGroupPermission);
  }

  return userGroupPermissions;
}

export async function createAppGroupPermission(nestApp, app, groupId, permissions) {
  const appGroupPermissionRepository: Repository<AppGroupPermission> = nestApp.get('AppGroupPermissionRepository');

  const appGroupPermission = appGroupPermissionRepository.create({
    groupPermissionId: groupId,
    appId: app.id,
    ...permissions,
  });
  await appGroupPermissionRepository.save(appGroupPermission);

  return appGroupPermission;
}

export async function createGroupPermission(nestApp, params) {
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get('GroupPermissionRepository');
  let groupPermission = groupPermissionRepository.create({
    ...params,
  });
  await groupPermissionRepository.save(groupPermission);

  return groupPermission;
}

export async function maybeCreateDefaultGroupPermissions(nestApp, organizationId) {
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get('GroupPermissionRepository');

  const defaultGroups = ['all_users', 'admin'];

  for (let group of defaultGroups) {
    const orgDefaultGroupPermissions = await groupPermissionRepository.find({
      where: {
        organizationId: organizationId,
        group: group,
      },
    });

    if (orgDefaultGroupPermissions.length == 0) {
      const groupPermission = groupPermissionRepository.create({
        organizationId: organizationId,
        group: group,
        appCreate: group == 'admin',
        appDelete: group == 'admin',
        folderCreate: group == 'admin',
        orgEnvironmentVariableCreate: group == 'admin',
        orgEnvironmentVariableUpdate: group == 'admin',
        orgEnvironmentVariableDelete: group == 'admin',
        folderUpdate: group == 'admin',
        folderDelete: group == 'admin',
      });
      await groupPermissionRepository.save(groupPermission);
    }
  }
}

export async function maybeCreateAdminAppGroupPermissions(nestApp, app) {
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get('GroupPermissionRepository');
  const appGroupPermissionRepository: Repository<AppGroupPermission> = nestApp.get('AppGroupPermissionRepository');

  const orgAdminGroupPermissions = await groupPermissionRepository.findOne({
    where: {
      organizationId: app.organizationId,
      group: 'admin',
    },
  });

  if (orgAdminGroupPermissions) {
    const adminGroupPermissions = {
      read: true,
      update: true,
      delete: true,
    };

    const appGroupPermission = appGroupPermissionRepository.create({
      groupPermissionId: orgAdminGroupPermissions.id,
      appId: app.id,
      ...adminGroupPermissions,
    });
    await appGroupPermissionRepository.save(appGroupPermission);
  }
}

export async function maybeCreateAllUsersAppGroupPermissions(nestApp, app) {
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get('GroupPermissionRepository');
  const appGroupPermissionRepository: Repository<AppGroupPermission> = nestApp.get('AppGroupPermissionRepository');

  const allUsersGroup = await groupPermissionRepository.findOne({
    where: {
      organizationId: app.organizationId,
      group: 'all_users',
    },
  });

  if (allUsersGroup) {
    const permissions = {
      read: false,
      update: false,
      delete: false,
    };

    const appGroupPermission = appGroupPermissionRepository.create({
      groupPermissionId: allUsersGroup.id,
      appId: app.id,
      ...permissions,
    });
    await appGroupPermissionRepository.save(appGroupPermission);
  }
}

export async function addAppToGroupPermission(app: App, groupPermission: GroupPermission, permissions = {}) {
  getManager().create(AppGroupPermission, {
    groupPermissionId: groupPermission.id,
    appId: app.id,
    ...permissions,
  });
}

export async function addAllUsersGroupToUser(nestApp, user) {
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get('GroupPermissionRepository');
  const userGroupPermissionRepository: Repository<UserGroupPermission> = nestApp.get('UserGroupPermissionRepository');

  const orgDefaultGroupPermissions = await groupPermissionRepository.findOneOrFail({
    where: {
      organizationId: user.organizationId,
      group: 'all_users',
    },
  });

  const userGroupPermission = userGroupPermissionRepository.create({
    groupPermissionId: orgDefaultGroupPermissions.id,
    userId: user.id,
  });
  await userGroupPermissionRepository.save(userGroupPermission);

  return user;
}

export async function createDataSource(
  nestApp,
  { appVersion, name, kind, type = 'default', options, environmentId = null }: any
) {
  let dataSourceRepository: Repository<DataSource>;
  dataSourceRepository = nestApp.get('DataSourceRepository');

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
  dataQueryRepository = nestApp.get('DataQueryRepository');

  return await dataQueryRepository.save(
    dataQueryRepository.create({
      options,
      name,
      dataSource,
      appVersion,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
}

export async function createDataSourceOption(nestApp, { dataSource, environmentId, options }: any) {
  let dataSourceOptionsRepository: Repository<DataSourceOptions>;
  dataSourceOptionsRepository = nestApp.get('DataSourceOptionsRepository');

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
  fileRepository = nestApp.get('FileRepository');
  const createFileDto = new CreateFileDto();
  createFileDto.filename = 'testfile';
  createFileDto.data = Buffer.from([1, 2, 3, 4]);
  return await fileRepository.save(fileRepository.create(createFileDto));
}

export async function installPlugin(nestApp: any, { name, description, id, version }: any) {
  let pluginRepository: Repository<Plugin>;
  pluginRepository = nestApp.get('PluginRepository');
  const createPluginDto = new CreatePluginDto();
  createPluginDto.id = id;
  createPluginDto.name = name;
  createPluginDto.version = version;
  createPluginDto.description = description;

  const pluginsService = nestApp.select(PluginsModule).get(PluginsService);

  return await pluginRepository.save(pluginsService.install(createPluginDto));
}

export async function createThread(_nestApp, { appId, x, y, userId, organizationId, appVersionsId }: any) {
  const threadRepository = new ThreadRepository();

  return await threadRepository.createThread(
    {
      appId,
      x,
      y,
      isResolved: false,
      organizationId,
      appVersionsId,
      pageId: 'placeholder',
    },
    userId,
    organizationId
  );
}

export async function setupOrganization(nestApp) {
  const adminUserData = await createUser(nestApp, {
    email: 'admin@tooljet.io',
    groups: ['all_users', 'admin'],
  });
  const adminUser = adminUserData.user;
  const organization = adminUserData.organization;
  const defaultUserData = await createUser(nestApp, {
    email: 'developer@tooljet.io',
    groups: ['all_users'],
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
    `/api/verify-invite-token?token=${invitationToken}${
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

export const generateAppDefaults = async (
  app: INestApplication,
  user: any,
  { isQueryNeeded = true, isDataSourceNeeded = true, isAppPublic = false, dsKind = 'restapi', dsOptions = [{}] }
) => {
  const application = await createApplication(
    app,
    {
      name: 'name',
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
    await createDataSourceOption(app, { dataSource, environmentId: appEnvironments[0].id, options: dsOptions });

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

  return { application, appVersion, dataSource, dataQuery };
};

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

export const authenticateUser = async (app: INestApplication, email = 'admin@tooljet.io', password = 'password') => {
  const sessionResponse = await request
    .agent(app.getHttpServer())
    .post('/api/authenticate')
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
