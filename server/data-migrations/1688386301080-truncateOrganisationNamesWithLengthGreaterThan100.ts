import { MigrationInterface, QueryRunner, EntityManager } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';

export class TruncateOrganisationNamesWithLengthGreaterThan1001688386301080 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await this.truncateOrganizationNames(entityManager);
  }

  public async truncateOrganizationNames(entityManager: EntityManager) {
    const organizations = await entityManager.find(Organization, {
      where: 'LENGTH(name) > 100',
    });

    for (const organization of organizations) {
      organization.name = organization.name.substring(0, 100);
    }

    await entityManager.save(organizations);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
