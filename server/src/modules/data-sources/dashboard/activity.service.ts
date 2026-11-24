import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

// clock_timestamp(), not now(): now() is frozen per transaction (and the e2e suite runs in one).
const STALE = "clock_timestamp() - interval '5 minutes'";

// Modified by = user with the latest last_edited_at for the data source + branch, so the throttle
// may only skip writes that can't change that answer: own row < 5 min old AND nobody newer.
const EDIT_UPSERT = (branchSource: string) => `
  INSERT INTO user_data_source_activity (user_id, data_source_id, branch_id, last_edited_at)
  SELECT $1, $2, b.branch_id, clock_timestamp() FROM (${branchSource}) AS b(branch_id) WHERE b.branch_id IS NOT NULL
  ON CONFLICT (user_id, data_source_id, branch_id) DO UPDATE SET last_edited_at = EXCLUDED.last_edited_at
  WHERE user_data_source_activity.last_edited_at IS NULL
     OR user_data_source_activity.last_edited_at < ${STALE}
     OR EXISTS (
       SELECT 1 FROM user_data_source_activity other
       WHERE other.data_source_id = user_data_source_activity.data_source_id
         AND other.branch_id = user_data_source_activity.branch_id
         AND other.user_id <> user_data_source_activity.user_id
         AND other.last_edited_at > user_data_source_activity.last_edited_at
     )`;

// Request branch when it is a branch of the data source's workspace (NULL otherwise, so no write),
// else the workspace default branch — never the request body's org id.
const DATA_SOURCE_BRANCH = `SELECT (
  SELECT wb.id FROM organization_git_sync_branches wb JOIN data_sources ds ON ds.organization_id = wb.organization_id
  WHERE ds.id = $2 AND ds.organization_id = $4 AND (wb.id = $3::uuid OR ($3::uuid IS NULL AND wb.is_default)))`;

@Injectable()
export class DataSourceActivityService {
  constructor(private readonly dataSource: DataSource) {}

  async recordEdit(
    userId: string,
    dataSourceId: string,
    organizationId: string,
    branchId: string | null
  ): Promise<void> {
    await this.dataSource.query(EDIT_UPSERT(DATA_SOURCE_BRANCH), [userId, dataSourceId, branchId, organizationId]);
  }

  async recordView(
    userId: string,
    dataSourceId: string,
    organizationId: string,
    branchId: string | null
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO user_data_source_activity (user_id, data_source_id, branch_id, last_viewed_at)
       SELECT $1, $2, b.branch_id, clock_timestamp() FROM (${DATA_SOURCE_BRANCH}) AS b(branch_id) WHERE b.branch_id IS NOT NULL
       ON CONFLICT (user_id, data_source_id, branch_id) DO UPDATE SET last_viewed_at = EXCLUDED.last_viewed_at
       WHERE user_data_source_activity.last_viewed_at IS NULL OR user_data_source_activity.last_viewed_at < ${STALE}`,
      [userId, dataSourceId, branchId, organizationId]
    );
  }
}
