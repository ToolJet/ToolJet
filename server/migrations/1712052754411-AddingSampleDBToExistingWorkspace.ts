import { Organization } from 'src/entities/organization.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { AppModule } from 'src/app.module';
import { NestFactory } from '@nestjs/core/nest-factory';
import { DataSourcesService } from '@services/data_sources.service';
import { filePathForEnvVars } from '../scripts/database-config-utils';
import { DataSourceScopes, DataSourceTypes } from 'src/helpers/data_source.constants';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { DataSource } from 'src/entities/data_source.entity';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

export class AddingSampleDBToExistingWorkspace1712052754411 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const appCtx = await NestFactory.createApplicationContext(AppModule);
    let data: any = process.env;
    const envVarsFilePath = filePathForEnvVars(process.env.NODE_ENV);

    if (fs.existsSync(envVarsFilePath)) {
      data = { ...data, ...dotenv.parse(fs.readFileSync(envVarsFilePath)) };
    }
    const dataSourceService = appCtx.get(DataSourcesService, { strict: false });
    const entityManager = queryRunner.manager;
    await this.addSampleDB(entityManager, dataSourceService, data);
    await appCtx.close();
  }

  public async addSampleDB(entityManager: EntityManager, dataSourceService: DataSourcesService, envVar: any) {
    const workspaces = await entityManager.find(Organization, {
      select: ['id'],
    });
    for (const workspace of workspaces) {
      const { id: organizationId } = workspace;
      const config = {
        name: 'Sample Data Source',
        kind: 'postgresql',
        type: DataSourceTypes.SAMPLE,
        scope: DataSourceScopes.GLOBAL,
        organization_id: organizationId,
      };
      const options = [
        {
          key: 'host',
          value: envVar.PG_HOST,
          encrypted: true,
        },
        {
          key: 'port',
          value: envVar.PG_PORT,
          encrypted: true,
        },
        {
          key: 'database',
          value: 'sample_db',
        },
        {
          key: 'username',
          value: envVar.PG_USER,
          encrypted: true,
        },
        {
          key: 'password',
          value: envVar.PG_PASS,
          encrypted: true,
        },
        {
          key: 'ssl_enabled',
          value: false,
          encrypted: true,
        },
        { key: 'ssl_certificate', value: 'none', encrypted: false },
      ];
      const insertQueryText = `INSERT INTO "data_sources" (${Object.keys(config).join(', ')}) VALUES (${Object.values(
        config
      ).map((_, index) => `$${index + 1}`)}) RETURNING "id", "type", "scope", "created_at", "updated_at"`;
      const insertValues = Object.values(config);

      const dataSourceList = await entityManager.query(insertQueryText, insertValues);
      const dataSource: DataSource = dataSourceList[0];

      const allEnvs: AppEnvironment[] = await await entityManager.query(
        `
          SELECT *
          FROM app_environments
          WHERE organization_id = $1
          AND enabled = true
          ORDER BY priority ASC
        `,
        [organizationId]
      );

      await Promise.all(
        allEnvs?.map(async (env) => {
          const parsedOptions = await dataSourceService.parseOptionsForCreate(options);
          const insertQuery = `INSERT INTO "data_source_options" ( environment_id , data_source_id, options ) VALUES ( $1 , $2 , $3)`;
          const values = [env.id, dataSource.id, parsedOptions];
          await entityManager.query(insertQuery, values);
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
