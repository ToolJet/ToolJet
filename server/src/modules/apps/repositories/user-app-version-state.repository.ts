import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserAppVersionState } from '@entities/user_app_version_state.entity';

@Injectable()
export class UserAppVersionStateRepository extends Repository<UserAppVersionState> {
  constructor(private dataSource: DataSource) {
    super(UserAppVersionState, dataSource.createEntityManager());
  }

  findForUserApp(userId: string, appId: string, manager?: EntityManager): Promise<UserAppVersionState | null> {
    const m = manager ?? this.manager;
    return m.findOne(UserAppVersionState, { where: { userId, appId } });
  }

  // Last-writer-wins under concurrent calls is acceptable here; this is bookkeeping, not the request's write of record.
  async upsert(userId: string, appId: string, versionId: string, manager?: EntityManager): Promise<void> {
    const m = manager ?? this.manager;
    await m
      .createQueryBuilder()
      .insert()
      .into(UserAppVersionState)
      .values({ userId, appId, versionId, updatedAt: new Date() })
      .orUpdate(['version_id', 'updated_at'], ['user_id', 'app_id'])
      .execute();
  }
}
