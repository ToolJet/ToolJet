import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

// clock_timestamp(), not now(): now() is frozen per transaction (and the e2e suite runs in one).
const STALE = "clock_timestamp() - interval '5 minutes'";

// Modified by = user with the latest last_edited_at for the app + branch, so the throttle may
// only skip writes that can't change that answer: own row < 5 min old AND nobody newer.
const EDIT_UPSERT = (branchSource: string) => `
  INSERT INTO user_app_activity (user_id, app_id, branch_id, last_edited_at)
  SELECT $1, $2, b.branch_id, clock_timestamp() FROM (${branchSource}) AS b(branch_id) WHERE b.branch_id IS NOT NULL
  ON CONFLICT (user_id, app_id, branch_id) DO UPDATE SET last_edited_at = EXCLUDED.last_edited_at
  WHERE user_app_activity.last_edited_at IS NULL
     OR user_app_activity.last_edited_at < ${STALE}
     OR EXISTS (
       SELECT 1 FROM user_app_activity other
       WHERE other.app_id = user_app_activity.app_id
         AND other.branch_id = user_app_activity.branch_id
         AND other.user_id <> user_app_activity.user_id
         AND other.last_edited_at > user_app_activity.last_edited_at
     )`;

const VERSION_BRANCH = 'SELECT av.branch_id FROM app_versions av WHERE av.id = $3 AND av.app_id = $2';
// App-level edits (rename / icon / public) carry no version: use the request branch, else the
// workspace default branch.
const APP_BRANCH = `SELECT COALESCE($3::uuid, (
  SELECT wb.id FROM organization_git_sync_branches wb JOIN apps a ON a.organization_id = wb.organization_id
  WHERE a.id = $2 AND wb.is_default))`;

@Injectable()
export class DashboardActivityService {
  constructor(private readonly dataSource: DataSource) {}

  async recordEdit(userId: string, appId: string, versionId: string): Promise<void> {
    await this.dataSource.query(EDIT_UPSERT(VERSION_BRANCH), [userId, appId, versionId]);
  }

  async recordAppEdit(userId: string, appId: string, branchId: string | null): Promise<void> {
    await this.dataSource.query(EDIT_UPSERT(APP_BRANCH), [userId, appId, branchId]);
  }

  async recordView(userId: string, appId: string, versionId: string): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO user_app_activity (user_id, app_id, branch_id, last_viewed_at)
       SELECT $1, av.app_id, av.branch_id, clock_timestamp() FROM app_versions av WHERE av.id = $3 AND av.app_id = $2
       ON CONFLICT (user_id, app_id, branch_id) DO UPDATE SET last_viewed_at = EXCLUDED.last_viewed_at
       WHERE user_app_activity.last_viewed_at IS NULL OR user_app_activity.last_viewed_at < ${STALE}`,
      [userId, appId, versionId]
    );
  }
}
