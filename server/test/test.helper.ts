/* eslint-disable prefer-const */
export * from './helpers/bootstrap';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource as TypeOrmDataSource, Repository } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { OrganizationUser } from '@entities/organization_user.entity';
import { Organization } from '@entities/organization.entity';
import { User } from '@entities/user.entity';
import { App } from '@entities/app.entity';
import { File } from '@entities/file.entity';
import { INestApplication } from '@nestjs/common';
import { AppVersion } from '@entities/app_version.entity';
import { DataQuery } from '@entities/data_query.entity';
import { DataSource } from '@entities/data_source.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE, ResourceType } from '@modules/group-permissions/constants';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { DataSourcesGroupPermissions } from '@entities/data_sources_group_permissions.entity';
import { GroupApps } from '@entities/group_apps.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { v4 as uuidv4 } from 'uuid';
import { CreateFileDto } from '@modules/files/dto';
import * as request from 'supertest';
import { AppEnvironment } from '@entities/app_environments.entity';
import { defaultAppEnvironments } from '@helpers/utils.helper';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { InternalTable } from '@entities/internal_table.entity';
import { Page } from '@entities/page.entity';
import { Credential } from '@entities/credential.entity';
import { SSOConfigs, SSOType, ConfigScope } from '@entities/sso_config.entity';
import { getDefaultDataSource, getTooljetDbDataSource } from './helpers/bootstrap';

export function buildAuthHeader(user: User, organizationId?: string, isPasswordLogin = true): string {
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
/** @deprecated Use buildAuthHeader instead */
export const authHeaderForUser = buildAuthHeader;

export async function resetDB() {
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

  // Collect all table names that exist in the DB, then TRUNCATE them all in one
  // statement. Must filter out non-existent legacy tables first, because a single
  // TRUNCATE fails entirely if any table is missing.
  const existingRows: { table_name: string }[] = await ds.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  const existingSet = new Set(existingRows.map((r) => r.table_name));

  const tables: string[] = [];
  for (const entity of entities) {
    if (skippedTables.includes(entity.tableName)) continue;
    if (entity.tableName === 'instance_settings') continue;
    if (!existingSet.has(entity.tableName)) continue;
    tables.push(`"${entity.tableName}"`);
  }

  if (tables.length > 0) {
    // Terminate lingering backends that may hold locks from previous test files'
    // async operations (e.g., workflow executions completing after app.close()).
    // The current connection's pool will reconnect automatically.
    try {
      await ds.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid()
          AND state = 'idle in transaction'
      `);
    } catch {}

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await ds.query(`SET lock_timeout = '3s'`);
        await ds.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
        await ds.query(`SET lock_timeout = 0`);
        break;
      } catch (err: any) {
        try { await ds.query(`SET lock_timeout = 0`); } catch {}
        if (attempt < 4) {
          // On first retry, also kill ALL other connections (not just idle-in-transaction)
          if (attempt === 1) {
            try {
              await ds.query(`
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND pid <> pg_backend_pid()
              `);
            } catch {}
          }
          await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
          continue;
        }
        console.error('clearDB: TRUNCATE failed after 5 attempts:', err?.message?.substring(0, 120));
      }
    }
  }

  // Reset instance_settings to a consistent baseline for every test
  if (existingSet.has('instance_settings')) {
    await ds.query(`UPDATE "instance_settings" SET value='true' WHERE key='ALLOW_PERSONAL_WORKSPACE'`);
  }
}
/** @deprecated Use resetDB instead */
export const clearDB = resetDB;

/**
 * Seeds instance-level SSO configs (git, google, openid) in the DB.
 * Required for OAuth tests because getSSOConfigs() in ee/auth/util.service.ts
 * expects these rows to exist (crashes with "Cannot read properties of undefined"
 * when the ssoConfigMap has no entry for the requested SSO type).
 *
 * @param options.enabled - Whether SSO is enabled (default: true for test convenience)
 * @param options.gitConfigs - Override git SSO configs
 * @param options.googleConfigs - Override google SSO configs
 */
export async function ensureInstanceSSOConfigs(options?: {
  enabled?: boolean;
  gitConfigs?: Record<string, any>;
  googleConfigs?: Record<string, any>;
}) {
  const ds = getDefaultDataSource();
  const ssoRepo = ds.getRepository(SSOConfigs);
  const enabled = options?.enabled ?? true;

  // Use empty strings for secrets to avoid decryption errors
  // (EncryptionService.decryptSecret skips falsy values)
  const types = [
    { sso: SSOType.GIT, configs: options?.gitConfigs ?? { clientId: 'git-client-id', clientSecret: '' } },
    { sso: SSOType.GOOGLE, configs: options?.googleConfigs ?? { clientId: 'google-client-id' } },
    { sso: SSOType.OPENID, configs: { clientId: '', clientSecret: '', name: '', wellKnownUrl: '' } },
  ];

  for (const { sso, configs } of types) {
    const existing = await ssoRepo.findOne({ where: { sso, organizationId: null as any, configScope: ConfigScope.INSTANCE } });
    if (!existing) {
      await ssoRepo.save(
        ssoRepo.create({
          sso,
          configs: configs as any,
          enabled,
          organizationId: null,
          configScope: ConfigScope.INSTANCE,
        })
      );
    }
  }

  // Also ensure ENABLE_SIGNUP is true so SSO can create new users
  await ds.query(`UPDATE "instance_settings" SET value='true' WHERE key='ENABLE_SIGNUP'`);
}
/** @deprecated Use ensureInstanceSSOConfigs instead */
export const seedInstanceSSOConfigs = ensureInstanceSSOConfigs;

async function dropTooljetDbTables() {
  const ds = getDefaultDataSource();
  const tooljetDbDs = getTooljetDbDataSource();

  const internalTables = (await ds.manager.find(InternalTable, { select: ['id'] })) as InternalTable[];

  if (tooljetDbDs) {
    for (const table of internalTables) {
      await tooljetDbDs.query(`DROP TABLE IF EXISTS "${table.id}" CASCADE`);
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
    await ensureAppEnvironments(nestApp, user.organizationId);
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

export async function createApplicationVersion(
  nestApp,
  application,
  { name = 'v0', definition = null, currentEnvironmentId = null } = {}
) {
  let appVersionsRepository: Repository<AppVersion>;
  let appEnvironmentsRepository: Repository<AppEnvironment>;
  const ds = getDefaultDataSource();
  appVersionsRepository = ds.getRepository(AppVersion);
  appEnvironmentsRepository = ds.getRepository(AppEnvironment);
  const pageRepository = ds.getRepository(Page);
  const appRepository = ds.getRepository(App);

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

  const version = await appVersionsRepository.save(
    appVersionsRepository.create({
      appId: application.id,
      name: name + Date.now(),
      currentEnvironmentId: envId,
      definition,
    })
  );

  // Create a default page for this version so EE page-level permission checks don't
  // treat an empty page list as "no accessible pages" (since [].every() === true).
  const defaultPage = await pageRepository.save(
    pageRepository.create({
      name: 'Home',
      handle: 'home',
      appVersionId: version.id,
      index: 1,
      autoComputeLayout: true,
    })
  );

  // Set homePageId, globalSettings, and showViewerNavigation on the version,
  // matching the production create flow in apps/util.service.ts
  await appVersionsRepository.update(version.id, {
    homePageId: defaultPage.id,
    showViewerNavigation: true,
    globalSettings: {
      appInMaintenance: false,
      canvasMaxWidth: 100,
      canvasMaxWidthType: '%',
      canvasMaxHeight: 2400,
      canvasBackgroundColor: 'var(--cc-appBackground-surface)',
      backgroundFxQuery: '',
      appMode: 'light',
    } as any,
  });
  version.homePageId = defaultPage.id;

  return version;
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

export async function ensureAppEnvironments(nestApp, organizationId): Promise<AppEnvironment[]> {
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
/** @deprecated Use ensureAppEnvironments instead */
export const createAppEnvironments = ensureAppEnvironments;

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
export async function grantAppPermission(nestApp, application, groupId, permissions: { read?: boolean; update?: boolean; delete?: boolean }) {
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
/** @deprecated Use grantAppPermission instead */
export const createAppGroupPermission = grantAppPermission;

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

async function maybeCreateDefaultGroupPermissions(nestApp, organizationId) {
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

async function addEndUserGroupToUser(nestApp, user) {
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
const addAllUsersGroupToUser = addEndUserGroupToUser;

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
      // DB constraint: static type data sources must have global scope
      scope: type === 'static' ? 'global' : 'local',
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
  const ds = getDefaultDataSource();
  const dataSourceOptionsRepository = ds.getRepository(DataSourceOptions);
  const credentialRepository = ds.getRepository(Credential);

  // Match production behavior: create Credential records for encrypted options
  const parsedOptions: Record<string, any> = {};
  if (Array.isArray(options)) {
    for (const opt of options) {
      if (opt.encrypted === 'true' || opt.encrypted === true) {
        const credential = await credentialRepository.save(
          credentialRepository.create({ valueCiphertext: opt.value || '' })
        );
        parsedOptions[opt.key] = {
          credential_id: credential.id,
          encrypted: true,
        };
      } else {
        parsedOptions[opt.key] = { value: opt.value, encrypted: false };
      }
    }
  } else if (options) {
    Object.assign(parsedOptions, options);
  }

  return await dataSourceOptionsRepository.save(
    dataSourceOptionsRepository.create({
      options: parsedOptions,
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


export const verifyInviteToken = async (app: INestApplication, user: User, verifyForSignup = false) => {
  const organizationUsersRepository: Repository<OrganizationUser> = getDefaultDataSource().getRepository(OrganizationUser);

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

export const createAppWithDependencies = async (
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

  const appEnvironments = await ensureAppEnvironments(app, user.organizationId);
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
/** @deprecated Use createAppWithDependencies instead */
export const generateAppDefaults = createAppWithDependencies;

export const findAppWithRelations = async (id: string) => {
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
/** @deprecated Use findAppWithRelations instead */
export const getAppWithAllDetails = findAppWithRelations;

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

/**
 * Creates a test session and returns a JWT cookie WITHOUT calling the login endpoint.
 * Avoids login-flow side effects (new org creation, event emitter, async handlers)
 * that cause deadlocks and FK violations in tests.
 */
export const buildTestSession = async (
  user: User,
  organizationId?: string
): Promise<{ tokenCookie: string[] }> => {
  const ds = getDefaultDataSource();
  const configService = new ConfigService();
  const jwtService = new JwtService({
    secret: configService.get<string>('SECRET_KEY_BASE'),
  });

  const orgId = organizationId || user.defaultOrganizationId;

  // Create a user_session row directly, then verify it exists
  const sessionResult = await ds.query(
    `INSERT INTO user_sessions (user_id, device, created_at, expiry, last_logged_in)
     VALUES ($1, 'test-agent', NOW(), NOW() + INTERVAL '1 day', NOW())
     RETURNING id`,
    [user.id]
  );
  const sessionId = sessionResult[0].id;

  // Verify the session is readable (guards against connection pool isolation issues)
  const verify = await ds.query('SELECT id FROM user_sessions WHERE id = $1', [sessionId]);
  if (!verify.length) {
    throw new Error(`buildTestSession: session ${sessionId} not found after INSERT`);
  }

  const payload = {
    sessionId,
    username: user.id,
    sub: user.email,
    organizationIds: [orgId],
    isPasswordLogin: true,
    isSSOLogin: false,
  };

  const token = jwtService.sign(payload);
  // Format as Set-Cookie header array (same format as express response.headers['set-cookie'])
  const cookie = [`tj_auth_token=${token}; Max-Age=63072000; Path=/; HttpOnly; SameSite=Strict`];

  return { tokenCookie: cookie };
};
/** @deprecated Use buildTestSession instead */
export const createTestSession = buildTestSession;

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

/**
 * Sets the currentVersionId on the app, simulating a "release".
 * Required by EE webhook service which looks up workflowApp.currentVersionId.
 */
export const markVersionAsReleased = async (appId: string, versionId: string) => {
  const ds = getDefaultDataSource();
  await ds.manager
    .createQueryBuilder()
    .update(App)
    .set({ currentVersionId: versionId })
    .where('id = :id', { id: appId })
    .execute();
};
/** @deprecated Use markVersionAsReleased instead */
export const releaseAppVersion = markVersionAsReleased;

// --- Workflow-specific helpers ---
// TODO: migrate to workflows.helper.ts once getDefaultDataSource() is shared
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

