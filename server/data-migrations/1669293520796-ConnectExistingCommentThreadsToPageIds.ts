import { MigrationInterface, QueryRunner } from 'typeorm';
import { Thread } from '../src/entities/thread.entity';
import { AppVersion } from '../src/entities/app_version.entity';

export class ConnectExistingCommentThreadsToPageIds1669293520796 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const threads = await entityManager.find(Thread);
    for (const thread of threads) {
      const appVersion = await entityManager.findOne(AppVersion, {
        where: {
          id: thread.appVersionsId,
        },
      });
      if (appVersion?.definition) {
        const pageId = Object.keys(appVersion.definition.pages)?.[0];
        await entityManager.update(Thread, { id: thread.id }, { pageId });
      }
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
