import { EncryptionService } from '@services/encryption.service';
import { OrgEnvironmentConstantValue } from 'src/entities/org_environment_constant_values.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class EncryptValuesForExistingOrganizationConstants1709618105790 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const encryptionService = new EncryptionService();
    const entityManager = queryRunner.manager;

    const organizationConstantValues = await entityManager
      .createQueryBuilder(OrgEnvironmentConstantValue, 'orgEnvironmentConstantValue')
      .leftJoinAndSelect('orgEnvironmentConstantValue.organizationConstant', 'organizationConstant')
      .getMany();

    for (const organizationConstantValue of organizationConstantValues) {
      const { organizationConstant, value, id } = organizationConstantValue;
      const { organizationId } = organizationConstant;
      const encryptedValue = await encryptionService.encryptColumnValue(
        'org_environment_constant_values',
        organizationId,
        value
      );

      await dbTransactionWrap(async (manager: EntityManager) => {
        await manager.update(
          OrgEnvironmentConstantValue,
          {
            id,
          },
          { value: encryptedValue, updatedAt: new Date() }
        );
      }, entityManager);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
