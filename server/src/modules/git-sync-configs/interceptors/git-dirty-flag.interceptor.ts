import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { Request } from 'express';
import { from, Observable } from 'rxjs';
import { concatMap, switchMap } from 'rxjs/operators';
import { AppVersion } from '@entities/app_version.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { DataQueryFolder } from '@entities/data_query_folder.entity';
import { DataQuery } from '@entities/data_query.entity';
import { ChildType } from '@modules/data-query-folders/types';
import { GIT_DIRTY_SUBJECT_KEY, GitDirtySubjectType } from '../decorators/marks-git-dirty.decorator';

type QueryFolderChild = { childId?: unknown; childType?: unknown };
type QueryFolderWriteBody = QueryFolderChild & { appVersionId?: unknown; items?: unknown };

/**
 * Flips `hasUncommittedChanges: true` on the AppVersion/DataSourceVersion a write just touched,
 * but only when it was already `isSynced: true` — a resource that has never been pushed has
 * nothing to be "uncommitted" relative to. Guarded (`hasUncommittedChanges: false` in the
 * criteria) so it's a no-op UPDATE once already flagged — a burst of autosave calls in one
 * editing session costs one write, not one per call.
 *
 * Content-blind by design: an edit followed by a revert to identical content still leaves this
 * true until the next push (which no-ops harmlessly and clears it). See
 * gitsync/uncomitted-cahnge-detection.md at the repo root for the full design and rationale.
 *
 * Best-effort: a failure here is logged, never surfaced as a failure of the underlying request.
 */
@Injectable()
export class GitDirtyFlagInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GitDirtyFlagInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource() private readonly dataSource: TypeOrmDataSource
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const subjectType = this.reflector.get<GitDirtySubjectType>(GIT_DIRTY_SUBJECT_KEY, context.getHandler());
    if (!subjectType) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();

    if (subjectType === GitDirtySubjectType.QUERY_FOLDER) {
      // Resolved before the handler: a folder delete (or folder_and_queries delete) removes the
      // rows the owning version would otherwise be looked up from.
      return from(this.bestEffort(subjectType, () => this.resolveQueryFolderVersionId(request))).pipe(
        switchMap((versionId) =>
          next.handle().pipe(
            concatMap(async (result) => {
              if (versionId) await this.bestEffort(subjectType, () => this.markAppVersionDirty(versionId));
              return result;
            })
          )
        )
      );
    }

    return next.handle().pipe(
      concatMap(async (result) => {
        await this.bestEffort(subjectType, () => this.markDirty(subjectType, request));
        return result;
      })
    );
  }

  private async bestEffort<T>(subjectType: GitDirtySubjectType, fn: () => Promise<T>): Promise<T | undefined> {
    try {
      return await fn();
    } catch (err) {
      this.logger.warn(`Failed to set git dirty flag (${subjectType}): ${(err as Error)?.message}`);
      return undefined;
    }
  }

  private async markDirty(subjectType: GitDirtySubjectType, request: Request): Promise<void> {
    if (subjectType === GitDirtySubjectType.APP_VERSION) {
      // Most routes carry :versionId in the path; a couple (e.g. workflow-node query create)
      // have no versionId param and pass app_version_id in the body instead.
      const versionId =
        this.asString(request.params?.versionId) ??
        this.asString((request.body as { app_version_id?: unknown })?.app_version_id);
      if (!versionId) return;

      await this.markAppVersionDirty(versionId);
      return;
    }

    if (subjectType === GitDirtySubjectType.DATA_SOURCE) {
      const dataSourceId = this.asString(request.params?.id);
      if (!dataSourceId) return;

      const branchId = this.asString(request.query?.branch_id);

      await this.dataSource.getRepository(DataSourceVersion).update(
        {
          dataSourceId,
          ...(branchId ? { branchId } : {}),
          isSynced: true,
          hasUncommittedChanges: false,
        },
        { hasUncommittedChanges: true }
      );
    }
  }

  private async markAppVersionDirty(versionId: string): Promise<void> {
    await this.dataSource
      .getRepository(AppVersion)
      .update({ id: versionId, isSynced: true, hasUncommittedChanges: false }, { hasUncommittedChanges: true });
  }

  /**
   * Query-folder routes: create carries `appVersionId`; rename/delete carry the folder as `:id`;
   * reorder carries one child, batch-reorder a list of children (all in one version).
   */
  private async resolveQueryFolderVersionId(request: Request): Promise<string | undefined> {
    const body = (request.body ?? {}) as QueryFolderWriteBody;

    const bodyVersionId = this.asString(body.appVersionId);
    if (bodyVersionId) return bodyVersionId;

    const folderId = this.asString(request.params?.id);
    if (folderId) return this.findVersionIdOf(DataQueryFolder, folderId);

    const child: QueryFolderChild | undefined = Array.isArray(body.items) ? body.items[0] : body;
    const childId = this.asString(child?.childId);
    if (!childId) return undefined;

    return this.findVersionIdOf(child.childType === ChildType.FOLDER ? DataQueryFolder : DataQuery, childId);
  }

  private async findVersionIdOf(entity: typeof DataQueryFolder | typeof DataQuery, id: string) {
    const row = await this.dataSource
      .getRepository<DataQueryFolder | DataQuery>(entity)
      .findOne({ where: { id }, select: ['id', 'appVersionId'] });
    return row?.appVersionId;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }
}
