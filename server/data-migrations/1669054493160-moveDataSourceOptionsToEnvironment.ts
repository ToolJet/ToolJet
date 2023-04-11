import { AppVersion } from 'src/entities/app_version.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { EncryptionService } from '@services/encryption.service';
import { Credential } from 'src/entities/credential.entity';

export class moveDataSourceOptionsToEnvironment1669054493160 implements MigrationInterface {
  private nestApp;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create default environment for all apps
    this.nestApp = await NestFactory.createApplicationContext(AppModule);
    const entityManager = queryRunner.manager;
    const appVersions = await entityManager.find(AppVersion);
    if (appVersions?.length) {
      for (const appVersion of appVersions) {
        await this.associateDataQueriesAndSources(entityManager, appVersion);
      }
    }
  }

  private async associateDataQueriesAndSources(entityManager: EntityManager, appVersion: AppVersion) {
    const encryptionService = this.nestApp.get(EncryptionService);

    for (const { name, isDefault } of defaultAppEnvironments) {
      const environment = await entityManager.query(
        'insert into app_environments (name, "default", app_version_id, created_at, updated_at) values ($1, $2, $3, $4, $4) returning *',
        [name, isDefault, appVersion.id, new Date()]
      );

      // Get all data sources under app version
      const dataSources = await entityManager.query('select * from data_sources where app_version_id = $1', [
        appVersion.id,
      ]);

      if (dataSources?.length) {
        for (const dataSource of dataSources) {
          const options = !environment[0].default
            ? await this.filterEncryptedFromOptions(dataSource.options, encryptionService, entityManager)
            : dataSource.options;
          await entityManager.save(
            entityManager.create(DataSourceOptions, {
              dataSourceId: dataSource.id,
              environmentId: environment[0].id,
              options,
            })
          );
        }
      }
    }
  }

  private convertToArrayOfKeyValuePairs(options): Array<object> {
    if (!options) return;
    return Object.keys(options).map((key) => {
      return {
        key: key,
        value: options[key]['value'],
        encrypted: options[key]['encrypted'],
        credential_id: options[key]['credential_id'],
      };
    });
  }

  private async filterEncryptedFromOptions(
    options: Array<object>,
    encryptionService: EncryptionService,
    entityManager: EntityManager
  ) {
    const kvOptions = this.convertToArrayOfKeyValuePairs(options);

    if (!kvOptions) return;

    const parsedOptions = {};

    for (const option of kvOptions) {
      if (option['encrypted']) {
        const credential = await this.createCredential('', encryptionService, entityManager);

        parsedOptions[option['key']] = {
          credential_id: credential.id,
          encrypted: option['encrypted'],
        };
      } else {
        parsedOptions[option['key']] = {
          value: option['value'],
          encrypted: false,
        };
      }
    }

    return parsedOptions;
  }

  async createCredential(
    value: string,
    encryptionService: EncryptionService,
    entityManager: EntityManager
  ): Promise<Credential> {
    const credentialRepository = entityManager.getRepository(Credential);
    const newCredential = credentialRepository.create({
      valueCiphertext: await encryptionService.encryptColumnValue('credentials', 'value', value),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const credential = await credentialRepository.save(newCredential);
    return credential;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
