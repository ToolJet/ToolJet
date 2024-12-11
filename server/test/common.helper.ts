import { InstanceSettings } from '@entities/instance_settings.entity';
import { Organization } from '@entities/organization.entity';
import { User } from '@entities/user.entity';
import { USER_ROLE } from '@modules/user_resource_permissions/constants/group-permissions.constant';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '@services/auth.service';
import { OrganizationsService } from '@services/organizations.service';
import { UsersService } from '@services/users.service';
import { INSTANCE_USER_SETTINGS } from '@instance-settings/constants';
import { Repository } from 'typeorm';
import { LibraryAppCreationService } from '@services/library_app_creation.service';
import { App } from '@entities/app.entity';
import { OrganizationUsersService } from '@services/organization_users.service';
import { OrganizationUser } from '@entities/organization_user.entity';
import { AppsService } from '@services/apps.service';
import { APP_TYPES } from '@ee/apps/constants';

export const createOrganization = async (
  nestApp: INestApplication,
  orgParams: Partial<Organization>,
  user?: User
): Promise<Organization> => {
  const { name, slug } = orgParams;
  const organizationsService = nestApp.get(OrganizationsService);
  const organization = await organizationsService.create(name, slug, user);
  return organization;
};

export const createUser = async (
  nestApp: INestApplication,
  userParams: Partial<User>,
  organizationId: string,
  role: USER_ROLE
): Promise<User> => {
  const usersService = nestApp.get(UsersService);
  const user = await usersService.create(userParams, organizationId, role);
  return user;
};

export const addUserToOrganization = async (
  nestApp: INestApplication,
  user: User,
  organization: Organization
): Promise<OrganizationUser> => {
  const organizationUsersService = nestApp.get(OrganizationUsersService);
  return await organizationUsersService.create(user, organization, false);
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

  return appsService.create(appName, user, APP_TYPES.FRONT_END);
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

  await nestApp.get(AuthService).createUserOrPersonalWorkspace(userParams, null);
  const user = await userRepository.findOneOrFail({ where: { email: userParams.email } });
  const organization = await organizationRepository.findOneOrFail({ where: { id: user.organizationId } });

  return { user, organization };
};

export const createTemplateAppForUser = async (
  nestApp: INestApplication,
  user: User,
  identifier: string,
  appName: string
): Promise<App> => {
  const appRepository = nestApp.get<Repository<App>>(getRepositoryToken(App));
  await nestApp.get(LibraryAppCreationService).perform(user, identifier, appName);

  return await appRepository.findOneOrFail({ where: { name: appName, organizationId: user.organizationId } });
};
