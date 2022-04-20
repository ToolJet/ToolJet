import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateSSOConfigs1650485473528 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const OrganizationRepository = entityManager.getRepository(Organization);

    const enableSignUp = process.env.SSO_DISABLE_SIGNUP !== 'true';
    const domain = process.env.SSO_RESTRICTED_DOMAIN;

    const organizations: Organization[] = await OrganizationRepository.find({ relations: ['ssoConfigs'] });

    if (organizations && organizations.length > 0) {
      for (const organization of organizations) {
        await OrganizationRepository.update({ id: organization.id }, { enableSignUp, ...(domain ? { domain } : {}) });
        // adding form configs for organizations which does not have any
        if (
          !organization.ssoConfigs?.some((og) => {
            og?.sso === 'form';
          })
        ) {
          await entityManager
            .createQueryBuilder()
            .insert()
            .into(SSOConfigs, ['organizationId', 'sso', 'enabled'])
            .values({
              organizationId: organization.id,
              sso: 'form',
              enabled: true,
            })
            .execute();
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
