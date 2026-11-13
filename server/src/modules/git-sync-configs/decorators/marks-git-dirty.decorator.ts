import { SetMetadata } from '@nestjs/common';

export const GIT_DIRTY_SUBJECT_KEY = 'gitDirtySubject';

export enum GitDirtySubjectType {
  APP_VERSION = 'appVersion',
  DATA_SOURCE = 'dataSource',
}

/**
 * Marks a controller write-method as content-mutating for git-sync "uncommitted changes"
 * tracking. `GitDirtyFlagInterceptor` resolves the target AppVersion from the route's
 * `:versionId` param and flips `hasUncommittedChanges: true` when it's already `isSynced: true`.
 * See gitsync/uncomitted-cahnge-detection.md at the repo root for the full design.
 */
export const MarksAppVersionDirty = (): MethodDecorator =>
  SetMetadata(GIT_DIRTY_SUBJECT_KEY, GitDirtySubjectType.APP_VERSION);

/**
 * Marks a controller write-method as content-mutating for git-sync "uncommitted changes"
 * tracking. `GitDirtyFlagInterceptor` resolves the target DataSourceVersion(s) from the route's
 * `:id` (dataSourceId) param, scoped to the `branch_id` query param when present.
 */
export const MarksDataSourceDirty = (): MethodDecorator =>
  SetMetadata(GIT_DIRTY_SUBJECT_KEY, GitDirtySubjectType.DATA_SOURCE);
