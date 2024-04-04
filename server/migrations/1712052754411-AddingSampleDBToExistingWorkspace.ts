import { Organization } from 'src/entities/organization.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { AppModule } from 'src/app.module';
import { NestFactory } from '@nestjs/core/nest-factory';
import { SampleDBService } from '@services/sample_db.service';

export class AddingSampleDBToExistingWorkspace1712052754411 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const appCtx = await NestFactory.createApplicationContext(AppModule);
    const sampleDBservice = appCtx.get(SampleDBService, { strict: false });
    const entityManager = queryRunner.manager;
    await this.addSampleDB(entityManager, sampleDBservice);
    await appCtx.close();
  }

  public async addSampleDB(entityManager: EntityManager, sampleDBservice: SampleDBService) {
    const workspaces = await entityManager.find(Organization, {
      select: ['id'],
    });
    for (const workspace of workspaces) {
      const { id: organizationId } = workspace;
      sampleDBservice.createSampleDB(organizationId, entityManager);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
