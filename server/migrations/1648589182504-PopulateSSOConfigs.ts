import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateSSOConfigs1648589182504 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const OrganizationRepository = entityManager.getRepository(Organization);

    const organizations: Organization[] = await OrganizationRepository.find();

    if (organizations && organizations.length > 0) {
      for (const organization of organizations) {
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

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
