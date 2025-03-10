import { DataSource as TypeOrmDataSource } from 'typeorm';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { Organization } from '@entities/organization.entity';
import { User } from '@entities/user.entity';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { INestApplication } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { SetupOrganizationsUtilService } from '@modules/setup-organization/util.service';
import { OnboardingUtilService } from '@modules/onboarding/util.service';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { Repository } from 'typeorm';
import { App } from '@entities/app.entity';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { OrganizationUser } from '@entities/organization_user.entity';
import { AppsService } from '@modules/apps/service';
import { InternalTable } from '@entities/internal_table.entity';

export const createOrganization = async (
  nestApp: INestApplication,
  orgParams: Partial<Organization>,
  user?: User
): Promise<Organization> => {
  const { name, slug } = orgParams;
  const setupOrganizationsUtilService = nestApp.get(SetupOrganizationsUtilService);
  const organization = await setupOrganizationsUtilService.create(name, slug, user);
  return organization;
};

export const createUser = async (
  nestApp: INestApplication,
  userParams: Partial<User>,
  organizationId: string,
  role: USER_ROLE
): Promise<User> => {
  const onboardingUtilService = nestApp.get(OnboardingUtilService);
  const user = await onboardingUtilService.create(userParams, organizationId, role);
  return user;
};

export const addUserToOrganization = async (
  nestApp: INestApplication,
  user: User,
  organization: Organization
): Promise<OrganizationUser> => {
  const organizationUsersRepository = nestApp.get(OrganizationUsersRepository);
  return await organizationUsersRepository.createOne(user, organization, false);
};

export const createAndAddUserToOrganization = async (
  nestApp: INestApplication,
  userParams: Partial<User>,
  organization: Organization,
  role: USER_ROLE
): Promise<User> => {
  const user = await createUser(nestApp, userParams, organization.id, role);
  await addUserToOrganization(nestApp, user, organization);
  return user;
};

export const createApplicationForUser = async (
  nestApp: INestApplication,
  user: User,
  appName: string
): Promise<App> => {
  // FIXME: AppsService require organizationId to be present on User object
  if (!user.organizationId) user.organizationId = user.defaultOrganizationId;
  const appsService = nestApp.get(AppsService);

  return appsService.create(user, { name: appName });
};

export const setupOrganizationAndUser = async (
  nestApp: INestApplication,
  userParams: { email: string; password: string; firstName: string; lastName: string },
  options: { allowPersonalWorkspace?: boolean } = {}
) => {
  const { allowPersonalWorkspace = true } = options;

  const instanceSettingsRepository = nestApp.get<Repository<InstanceSettings>>(getRepositoryToken(InstanceSettings));
  const userRepository = nestApp.get<Repository<User>>(getRepositoryToken(User));
  const organizationRepository = nestApp.get<Repository<Organization>>(getRepositoryToken(Organization));

  await instanceSettingsRepository.update(
    { key: INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE },
    { value: allowPersonalWorkspace.toString() }
  );

  await nestApp.get(OnboardingUtilService).createUserOrPersonalWorkspace(userParams, null, null);
  const user = await userRepository.findOneOrFail({ where: { email: userParams.email } });
  const organization = await organizationRepository.findOneOrFail({ where: { id: user.organizationId } });

  return { user, organization };
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

    // FIXME: Remove entity files in this list as they are deprecated
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

async function dropTooljetDbTables(defaultDataSource, tooljetDbDataSource) {
  const internalTables = await defaultDataSource.manager.find(InternalTable, {
    select: ['id'],
  });

  for (const table of internalTables) {
    await tooljetDbDataSource.query(`DROP TABLE IF EXISTS "${table.id}" CASCADE`);
  }
}
