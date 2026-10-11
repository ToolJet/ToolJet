import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Metadata } from '../src/entities/metadata.entity';
import { OnboardingStatus } from '../src/modules/onboarding/constants';
import { AppModule } from '@modules/app/module';
import { getImportPath } from '@modules/app/constants';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';

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

  const nestConfigs = { IS_GET_CONTEXT: true };
  const app = await NestFactory.createApplicationContext(await AppModule.register(nestConfigs), {
    logger: ['error', 'warn'],
  });
  const dataSource = app.get(DataSource);
  const manager = dataSource.manager;

  // These have EE overrides registered as the DI token under TOOLJET_EDITION=ee/cloud —
  // a static @modules/... import would resolve to the wrong (CE) class reference.
  const importPath = await getImportPath(nestConfigs.IS_GET_CONTEXT);
  const { SetupOrganizationsUtilService } = await import(`${importPath}/setup-organization/util.service`);
  const { OnboardingUtilService } = await import(`${importPath}/onboarding/util.service`);
  const { USER_ROLE } = await import(`${importPath}/group-permissions/constants`);

  const setupOrganizationsUtilService = app.get(SetupOrganizationsUtilService);
  const onboardingUtilService = app.get(OnboardingUtilService);
  const organizationUsersRepository = app.get(OrganizationUsersRepository);
  console.log('Database connected.');

  const existingUser = await manager.findOne(User, { where: { email: config.email } });
  if (existingUser) {
    console.log('Database already seeded. Skipping.');
    await app.close();
    process.exit(0);
  }

  await manager.transaction(async (txManager) => {
    const organization = await setupOrganizationsUtilService.create(
      { name: config.workspaceName, slug: config.workspaceName.toLowerCase().replace(/\s+/g, '-'), isDefault: true },
      null,
      txManager
    );

    const user = await onboardingUtilService.createUserWithRole(
      {
        firstName: config.firstName,
        lastName: config.lastName,
        email: config.email,
        password: config.password,
        defaultOrganizationId: organization.id,
        status: 'active',
        source: 'signup',
        userType: 'instance',
        onboardingStatus: OnboardingStatus.ONBOARDING_COMPLETED,
      },
      organization.id,
      USER_ROLE.ADMIN,
      txManager
    );

    await organizationUsersRepository.createOne(user, organization, false, txManager);

    // so frontend skips /setup entirely
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

  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
