import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { AppVersion } from '@entities/app_version.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { GIT_DIRTY_SUBJECT_KEY, GitDirtySubjectType } from '../decorators/marks-git-dirty.decorator';

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

    return next.handle().pipe(
      concatMap(async (result) => {
        try {
          await this.markDirty(subjectType, request);
        } catch (err) {
          this.logger.warn(`Failed to set git dirty flag (${subjectType}): ${(err as Error)?.message}`);
        }
        return result;
      })
    );
  }

  private async markDirty(subjectType: GitDirtySubjectType, request: Request): Promise<void> {
    if (subjectType === GitDirtySubjectType.APP_VERSION) {
      // Most routes carry :versionId in the path; a couple (e.g. workflow-node query create)
      // have no versionId param and pass app_version_id in the body instead.
      const versionId =
        this.asString(request.params?.versionId) ??
        this.asString((request.body as { app_version_id?: unknown })?.app_version_id);
      if (!versionId) return;

      await this.dataSource
        .getRepository(AppVersion)
        .update({ id: versionId, isSynced: true, hasUncommittedChanges: false }, { hasUncommittedChanges: true });
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

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }
}
