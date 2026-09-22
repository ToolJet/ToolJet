import { DataSource, EntityManager } from 'typeorm';
import { ormconfig, tooljetDbOrmconfig } from '../ormconfig';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import { SSOType, ConfigScope } from '@entities/sso_config.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { Metadata } from '@entities/metadata.entity';
import { seedOrgEnvironmentsAndDefaultBranch } from '@helpers/utils.helper';
import { OnboardingStatus } from '@modules/onboarding/constants';
import { DEFAULT_GROUP_PERMISSIONS } from '@modules/group-permissions/constants';
import { getEnvVars } from './database-config-utils';
import {
  isSQLModeDisabled,
  generateTJDBPasswordForRole,
  encryptTooljetDatabasePassword,
  updatePasswordToOrganizationTable,
  createNewTjdbRole,
  createAndGrantSchemaPrivilege,
  createAndGrantTablePrivilege,
  grantSequencePrivilege,
  grantTenantRoleToTjdbAdminRole,
} from '@helpers/tooljet_db.helper';

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

// Seed creates the Organization row directly instead of going through
// SetupOrganizationsUtilService.create() (the normal signup/workspace-creation path), so it has to
// provision the TJDB tenant schema/role itself - otherwise findTenantSchema()'s
// `workspace_<organizationId>` schema is never CREATEd and the first TJDB table create 500s.
async function provisionTjdbTenantSchema(organizationId: string, entityManager: EntityManager) {
  const envData = getEnvVars();
  const dbUser = `user_${organizationId}`;
  const dbSchema = `workspace_${organizationId}`;
  const dbPassword = generateTJDBPasswordForRole();

  const encryptedPassword = await encryptTooljetDatabasePassword(dbPassword);
  await updatePasswordToOrganizationTable(entityManager, organizationId, encryptedPassword, dbUser);

  const tooljetDbConnection = new DataSource({ ...(tooljetDbOrmconfig as any), name: 'seedTjdbConnection' });
  await tooljetDbConnection.initialize();
  try {
    await tooljetDbConnection.manager.transaction(async (tooljetDbTransactionManager) => {
      await createNewTjdbRole(tooljetDbTransactionManager, dbUser, dbPassword, envData.TOOLJET_DB);
      await createAndGrantSchemaPrivilege(tooljetDbTransactionManager, dbSchema, dbUser);
      await createAndGrantTablePrivilege(tooljetDbTransactionManager, dbSchema, dbUser, envData.TOOLJET_DB_USER);
      await grantSequencePrivilege(tooljetDbTransactionManager, dbSchema, dbUser, envData.TOOLJET_DB_USER);
      await grantTenantRoleToTjdbAdminRole(tooljetDbTransactionManager, dbUser, envData.TOOLJET_DB_USER);
      await tooljetDbTransactionManager.query("NOTIFY pgrst, 'reload schema'");
    });
  } finally {
    await tooljetDbConnection.destroy();
  }
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

    // 1.5. Provision the TJDB tenant schema/role - see provisionTjdbTenantSchema() for why.
    if (!isSQLModeDisabled()) {
      await provisionTjdbTenantSchema(organization.id, txManager);
    }

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

    // 4. Create default app environments + default workspace branch
    await seedOrgEnvironmentsAndDefaultBranch(organization.id, txManager);

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
    'Seeding complete. Use default credentials to login.\n' +
      `email: ${config.email}\n` +
      `password: ${config.password}`
  );

  await dataSource.destroy();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
