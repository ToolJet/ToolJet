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

export async function createNestAppInstance(): Promise<INestApplication> {
  let app: INestApplication;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    providers: [],
  }).compile();

  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
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

export async function createApplication(nestApp, { name, user, isPublic, slug }: any) {
  let appRepository: Repository<App>;
  appRepository = nestApp.get('AppRepository');

  user = user || (await (await createUser(nestApp, {})).user);

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

export async function createApplicationVersion(nestApp, application, { name = 'v0', definition = null } = {}) {
  let appVersionsRepository: Repository<AppVersion>;
  appVersionsRepository = nestApp.get('AppVersionRepository');

  return await appVersionsRepository.save(
    appVersionsRepository.create({
      app: application,
      name,
      definition,
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
    organizationName = 'Test Organization',
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

export async function createDataSource(nestApp, { name, application, kind, options, appVersion }: any) {
  let dataSourceRepository: Repository<DataSource>;
  dataSourceRepository = nestApp.get('DataSourceRepository');

  const dataSourcesService = nestApp.select(DataSourcesModule).get(DataSourcesService);

  return await dataSourceRepository.save(
    dataSourceRepository.create({
      name,
      options: await dataSourcesService.parseOptionsForCreate(options),
      app: application,
      kind,
      appVersion,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
}

export async function createDataQuery(nestApp, { application, name, kind, dataSource, options, appVersion }: any) {
  let dataQueryRepository: Repository<DataQuery>;
  dataQueryRepository = nestApp.get('DataQueryRepository');

  return await dataQueryRepository.save(
    dataQueryRepository.create({
      options,
      name,
      dataSource,
      createdAt: new Date(),
      updatedAt: new Date(),
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

  const {
    email,
    first_name,
    last_name,
    admin,
    group_permissions,
    app_group_permissions,
    organization_id,
    organization,
  } = response.body;

  expect(email).toEqual(user.email);
  expect(first_name).toEqual(user.firstName);
  expect(last_name).toEqual(user.lastName);
  expect(admin).toBeTruthy();
  expect(organization_id).toBe(org.id);
  expect(organization).toBe(org.name);
  expect(group_permissions).toHaveLength(2);
  expect(group_permissions.some((gp) => gp.group === 'all_users')).toBeTruthy();
  expect(group_permissions.some((gp) => gp.group === 'admin')).toBeTruthy();
  expect(Object.keys(group_permissions[0]).sort()).toEqual(
    [
      'id',
      'organization_id',
      'group',
      'app_create',
      'app_delete',
      'updated_at',
      'created_at',
      'folder_create',
      'org_environment_variable_create',
      'org_environment_variable_update',
      'org_environment_variable_delete',
      'folder_delete',
      'folder_update',
    ].sort()
  );
  expect(app_group_permissions).toHaveLength(0);
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
