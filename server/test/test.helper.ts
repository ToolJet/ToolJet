/* eslint-disable prefer-const */
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { getConnection, Repository } from "typeorm";
import { OrganizationUser } from "src/entities/organization_user.entity";
import { Organization } from "src/entities/organization.entity";
import { User } from "src/entities/user.entity";
import { App } from "src/entities/app.entity";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { AppVersion } from "src/entities/app_version.entity";
import { DataQuery } from "src/entities/data_query.entity";
import { DataSource } from "src/entities/data_source.entity";
import { DataSourcesService } from "src/services/data_sources.service";
import { DataSourcesModule } from "src/modules/data_sources/data_sources.module";
import { GroupPermission } from "src/entities/group_permission.entity";
import { UserGroupPermission } from "src/entities/user_group_permission.entity";
import { AppGroupPermission } from "src/entities/app_group_permission.entity";

export async function createNestAppInstance() {
  let app: INestApplication;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    providers: [],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  return app;
}

export function authHeaderForUser(user: any) {
  const configService = new ConfigService();
  const jwtService = new JwtService({
    secret: configService.get<string>("SECRET_KEY_BASE"),
  });
  const authPayload = { username: user.id, sub: user.email };
  const authToken = jwtService.sign(authPayload);
  return `Bearer ${authToken}`;
}

export async function clearDB() {
  const entities = getConnection().entityMetadatas;
  for (const entity of entities) {
    const repository = await getConnection().getRepository(entity.name);
    await repository.query(
      `TRUNCATE ${entity.tableName} RESTART IDENTITY CASCADE;`
    );
  }
}

export async function createApplication(
  nestApp,
  { name, user, isPublic, slug }: any
) {
  let appRepository: Repository<App>;
  appRepository = nestApp.get("AppRepository");

  user = user || (await (await createUser(nestApp, {})).user);

  const newApp = await appRepository.save(
    appRepository.create({
      name,
      user,
      slug,
      isPublic: isPublic || false,
      organizationId: user.organization.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  await maybeCreateAdminAppGroupPermissions(nestApp, newApp);
  await maybeCreateAllUsersAppGroupPermissions(nestApp, newApp);

  return newApp;
}

export async function createApplicationVersion(nestApp, application) {
  let appVersionsRepository: Repository<AppVersion>;
  appVersionsRepository = nestApp.get("AppVersionRepository");

  return await appVersionsRepository.save(
    appVersionsRepository.create({
      app: application,
      name: "v0",
    })
  );
}

export async function createUser(
  nestApp,
  { firstName, lastName, email, groups, organization, ssoId, status }: any
) {
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let organizationUsersRepository: Repository<OrganizationUser>;

  userRepository = nestApp.get("UserRepository");
  organizationRepository = nestApp.get("OrganizationRepository");
  organizationUsersRepository = nestApp.get("OrganizationUserRepository");

  organization =
    organization ||
    (await organizationRepository.save(
      organizationRepository.create({
        name: "test org",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ));

  const user = await userRepository.save(
    userRepository.create({
      firstName: firstName || "test",
      lastName: lastName || "test",
      email: email || "dev@tooljet.io",
      password: "password",
      organization,
      ssoId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  const orgUser = await organizationUsersRepository.save(
    organizationUsersRepository.create({
      user: user,
      organization,
      status: status || "invited",
      role: "all_users",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  await maybeCreateDefaultGroupPermissions(nestApp, user.organizationId);
  await createUserGroupPermissions(
    nestApp,
    user,
    groups || ["all_users", "admin"] // default groups
  );

  return { organization, user, orgUser };
}

export async function createUserGroupPermissions(nestApp, user, groups) {
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get(
    "GroupPermissionRepository"
  );

  const userGroupPermissionRepository: Repository<UserGroupPermission> =
    nestApp.get("UserGroupPermissionRepository");

  let userGroupPermissions = [];

  for (const group of groups) {
    let groupPermission: GroupPermission;

    if (group == "admin" || group == "all_users") {
      groupPermission = await groupPermissionRepository.findOneOrFail({
        where: {
          organizationId: user.organizationId,
          group: group,
        },
      });
    } else {
      groupPermission = groupPermissionRepository.create({
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

export async function createAppGroupPermission(
  nestApp,
  app,
  groupId,
  permissions
) {
  const appGroupPermissionRepository: Repository<AppGroupPermission> =
    nestApp.get("AppGroupPermissionRepository");

  const appGroupPermission = appGroupPermissionRepository.create({
    groupPermissionId: groupId,
    appId: app.id,
    ...permissions,
  });
  await appGroupPermissionRepository.save(appGroupPermission);

  return appGroupPermission;
}

export async function createGroupPermission(nestApp, params) {
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get(
    "GroupPermissionRepository"
  );
  let groupPermission = groupPermissionRepository.create({
    ...params,
  });
  await groupPermissionRepository.save(groupPermission);

  return groupPermission;
}

export async function maybeCreateDefaultGroupPermissions(
  nestApp,
  organizationId
) {
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get(
    "GroupPermissionRepository"
  );

  const defaultGroups = ["all_users", "admin"];

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
      });
      await groupPermissionRepository.save(groupPermission);
    }
  }
}

export async function maybeCreateAdminAppGroupPermissions(nestApp, app) {
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get(
    "GroupPermissionRepository"
  );
  const appGroupPermissionRepository: Repository<AppGroupPermission> =
    nestApp.get("AppGroupPermissionRepository");

  const orgAdminGroupPermissions = await groupPermissionRepository.findOne({
    organizationId: app.organizationId,
    group: "admin",
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
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get(
    "GroupPermissionRepository"
  );
  const appGroupPermissionRepository: Repository<AppGroupPermission> =
    nestApp.get("AppGroupPermissionRepository");

  const orgGroupPermissions = await groupPermissionRepository.findOne({
    organizationId: app.organizationId,
    group: "all_users",
  });

  if (orgGroupPermissions) {
    const permissions = {
      read: true,
      update: false,
      delete: false,
    };

    const appGroupPermission = appGroupPermissionRepository.create({
      groupPermissionId: orgGroupPermissions.id,
      appId: app.id,
      ...permissions,
    });
    await appGroupPermissionRepository.save(appGroupPermission);
  }
}

export async function addAllUsersGroupToUser(nestApp, user) {
  const groupPermissionRepository: Repository<GroupPermission> = nestApp.get(
    "GroupPermissionRepository"
  );
  const userGroupPermissionRepository: Repository<UserGroupPermission> =
    nestApp.get("UserGroupPermissionRepository");

  const orgDefaultGroupPermissions = await groupPermissionRepository.findOne({
    where: {
      organizationId: user.organizationId,
      group: "all_users",
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
  { name, application, kind, options }: any
) {
  let dataSourceRepository: Repository<DataSource>;
  dataSourceRepository = nestApp.get("DataSourceRepository");

  const dataSourcesService = nestApp
    .select(DataSourcesModule)
    .get(DataSourcesService);

  return await dataSourceRepository.save(
    dataSourceRepository.create({
      name,
      options: await dataSourcesService.parseOptionsForCreate(options),
      app: application,
      kind,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
}

export async function createDataQuery(
  nestApp,
  { application, kind, dataSource, options }: any
) {
  let dataQueryRepository: Repository<DataQuery>;
  dataQueryRepository = nestApp.get("DataQueryRepository");

  return await dataQueryRepository.save(
    dataQueryRepository.create({
      options,
      app: application,
      kind,
      dataSource,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
}
