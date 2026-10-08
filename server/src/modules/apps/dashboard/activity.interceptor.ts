import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, mergeMap } from 'rxjs';
import { DashboardActivityService } from './activity.service';

export interface ActivityRequest {
  method: string;
  params?: Record<string, string>;
  route?: { path?: string };
  body?: { app?: { branch_id?: string } };
  user?: { id: string; branchId?: string };
  tj_app?: { id: string; currentVersionId?: string | null };
}

export type ActivitySignal =
  | { kind: 'edit' | 'view'; userId: string; appId: string; versionId: string }
  | { kind: 'app_edit'; userId: string; appId: string; branchId: string | null };

// Running / previewing a query or pushing to git carries :versionId but changes no app content.
const NOT_AN_EDIT = /\/(run|preview)\/:environmentId$|\/gitpush\/:appId\/:versionId$/;
// App settings edits with no :versionId (rename, icon, public). DELETE /apps/:id is not an edit.
const APP_EDIT_ROUTE = /\/apps\/:id(\/icons|\/public)?$/;

// Builder edit routes carry :versionId and resolve request.tj_app in their guards, and the DB
// bump triggers move app_versions.updated_at on every child write, so "successful mutating
// request on a version" is where Modified by stays in step with Last modified.
export function classifyActivity(req: ActivityRequest): ActivitySignal | null {
  const userId = req.user?.id;
  const app = req.tj_app;
  const path = req.route?.path ?? '';
  if (!userId || !app?.id) return null;
  if (req.method !== 'GET' && req.params?.versionId) {
    return NOT_AN_EDIT.test(path) ? null : { kind: 'edit', userId, appId: app.id, versionId: req.params.versionId };
  }
  if (req.method === 'PUT' && APP_EDIT_ROUTE.test(path)) {
    const branchId = req.body?.app?.branch_id ?? req.user?.branchId ?? null;
    return { kind: 'app_edit', userId, appId: app.id, branchId };
  }
  if (req.method === 'GET' && path.endsWith('/apps/slugs/:slug') && app.currentVersionId) {
    return { kind: 'view', userId, appId: app.id, versionId: app.currentVersionId };
  }
  return null;
}

@Injectable()
export class DashboardActivityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DashboardActivityInterceptor.name);

  constructor(private readonly activityService: DashboardActivityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest<ActivityRequest>();
    return next.handle().pipe(
      mergeMap(async (body) => {
        const signal = classifyActivity(request);
        if (signal) await this.record(signal);
        return body;
      })
    );
  }

  // Attribution is best-effort: a failed upsert must never fail the edit/view itself.
  private async record(signal: ActivitySignal): Promise<void> {
    try {
      if (signal.kind === 'app_edit')
        await this.activityService.recordAppEdit(signal.userId, signal.appId, signal.branchId);
      else if (signal.kind === 'edit')
        await this.activityService.recordEdit(signal.userId, signal.appId, signal.versionId);
      else await this.activityService.recordView(signal.userId, signal.appId, signal.versionId);
    } catch (error) {
      this.logger.error(`dashboard activity ${signal.kind} failed for app ${signal.appId}`, error as Error);
    }
  }
}
