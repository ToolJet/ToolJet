import { DataSource } from 'typeorm';
import { ormconfig } from '../ormconfig';
import { User } from '../src/entities/user.entity';
import { Organization } from '../src/entities/organization.entity';
import { OrganizationUser } from '../src/entities/organization_user.entity';
import { SSOType, ConfigScope } from '../src/entities/sso_config.entity';
import { AppEnvironment } from '../src/entities/app_environments.entity';
import { GroupPermissions } from '../src/entities/group_permissions.entity';
import { GroupUsers } from '../src/entities/group_users.entity';
import { Metadata } from '../src/entities/metadata.entity';
import { defaultAppEnvironments } from '../src/helpers/utils.helper';
import { OnboardingStatus } from '../src/modules/onboarding/constants';
import { DEFAULT_GROUP_PERMISSIONS } from '../src/modules/group-permissions/constants';

const SEED_DEFAULTS = {
  email: 'dev@tooljet.io',
  password: 'password',
  firstName: 'The',
  lastName: 'Developer',
  workspaceName: 'My workspace',
};

function getSeedConfig() {
  return {
    email: process.env.SEED_EMAIL || SEED_DEFAULTS.email,
    password: process.env.SEED_PASSWORD || SEED_DEFAULTS.password,
    firstName: process.env.SEED_FIRST_NAME || SEED_DEFAULTS.firstName,
    lastName: process.env.SEED_LAST_NAME || SEED_DEFAULTS.lastName,
    workspaceName: process.env.SEED_WORKSPACE || SEED_DEFAULTS.workspaceName,
  };
}

async function bootstrap() {
  const config = getSeedConfig();

  const dataSource = new DataSource({
    ...(ormconfig as any),
    entities: [__dirname + '/../src/**/*.entity{.js,.ts}', __dirname + '/../ee/**/*.entity{.js,.ts}'],
  });

  await dataSource.initialize();
  console.log('Database connected.');

  const manager = dataSource.manager;

  // Check if already seeded
  const existingUser = await manager.findOne(User, { where: { email: config.email } });
  if (existingUser) {
    console.log('Database already seeded. Skipping.');
    await dataSource.destroy();
    process.exit(0);
  }

  await manager.transaction(async (txManager) => {
    // 1. Create organization with SSO config
    const organization = txManager.create(Organization, {
      name: config.workspaceName,
      slug: config.workspaceName.toLowerCase().replace(/\s+/g, '-'),
      isDefault: true,
      ssoConfigs: [
        {
          enabled: true,
          sso: SSOType.FORM,
          configScope: ConfigScope.ORGANIZATION,
        },
      ],
    });
    await txManager.save(organization);

    // 2. Create super admin user
    const user = txManager.create(User, {
      firstName: config.firstName,
      lastName: config.lastName,
      email: config.email,
      password: config.password,
      defaultOrganizationId: organization.id,
      status: 'active',
      source: 'signup',
      userType: 'instance',
      onboardingStatus: OnboardingStatus.ONBOARDING_COMPLETED,
    });
    await txManager.save(user);

    // 3. Create organization-user mapping
    const organizationUser = txManager.create(OrganizationUser, {
      organizationId: organization.id,
      userId: user.id,
      role: 'all_users',
      status: 'active',
      source: 'signup',
    });
    await txManager.save(organizationUser);

    // 4. Create default app environments
    for (const env of defaultAppEnvironments) {
      const appEnv = txManager.create(AppEnvironment, {
        organizationId: organization.id,
        name: env.name,
        isDefault: env.isDefault,
        priority: env.priority,
      });
      await txManager.save(appEnv);
    }

    // 5. Create default permission groups (admin, builder, end_user)
    for (const groupKey of Object.keys(DEFAULT_GROUP_PERMISSIONS)) {
      const groupDef = DEFAULT_GROUP_PERMISSIONS[groupKey];
      const group = txManager.create(GroupPermissions, {
        ...(groupDef as any),
        organizationId: organization.id,
      });
      await txManager.save(group);

      // Add user to admin group
      if (groupDef.name === 'admin') {
        const groupUser = txManager.create(GroupUsers, {
          groupId: group.id,
          userId: user.id,
        });
        await txManager.save(groupUser);
      }
    }

    // 6. Mark metadata as onboarded so frontend skips /setup entirely
    const [metadata] = await txManager.find(Metadata);
    if (metadata) {
      metadata.data = { ...metadata.data, onboarded: true };
      await txManager.save(metadata);
    }
  });

  console.log(
    'Seeding complete. Use default credentials to login.\n' + `email: ${config.email}\n` + `password: ${config.password}`
  );

  await dataSource.destroy();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
