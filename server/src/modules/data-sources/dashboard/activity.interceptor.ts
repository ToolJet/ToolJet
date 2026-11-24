import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, mergeMap } from 'rxjs';
import { DataSourceActivityService } from './activity.service';

export interface ActivityRequest {
  method: string;
  route?: { path?: string };
  query?: { branch_id?: string };
  user?: { id: string; organizationId?: string };
  tj_data_source?: { id: string; organizationId?: string };
}

export type ActivitySignal = {
  kind: 'edit' | 'view';
  userId: string;
  dataSourceId: string;
  organizationId: string;
  branchId: string | null;
};

// GET by environment is the call the frontend makes when the connection form opens or switches
// environment. A PUT on the data source (v1 update or v2 save-all) is an edit.
const VIEW_ROUTE = /\/data-sources\/:id\/environment\/:environment_id$/;
const EDIT_ROUTE = /\/data-sources\/:id$/;

export function classifyDataSourceActivity(req: ActivityRequest): ActivitySignal | null {
  const userId = req.user?.id;
  const dataSource = req.tj_data_source;
  const path = req.route?.path ?? '';
  if (!userId || !dataSource?.id) return null;

  const organizationId = dataSource.organizationId ?? req.user?.organizationId;
  if (!organizationId) return null;
  const branchId = req.query?.branch_id ?? null;

  if (req.method === 'GET' && VIEW_ROUTE.test(path)) {
    return { kind: 'view', userId, dataSourceId: dataSource.id, organizationId, branchId };
  }
  if (req.method === 'PUT' && EDIT_ROUTE.test(path)) {
    return { kind: 'edit', userId, dataSourceId: dataSource.id, organizationId, branchId };
  }
  return null;
}

@Injectable()
export class DataSourceActivityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DataSourceActivityInterceptor.name);

  constructor(private readonly activityService: DataSourceActivityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest<ActivityRequest>();
    return next.handle().pipe(
      mergeMap(async (body) => {
        const signal = classifyDataSourceActivity(request);
        if (signal) await this.record(signal);
        return body;
      })
    );
  }

  // Attribution is best-effort: a failed upsert must never fail the view/edit itself.
  private async record(signal: ActivitySignal): Promise<void> {
    try {
      if (signal.kind === 'edit')
        await this.activityService.recordEdit(
          signal.userId,
          signal.dataSourceId,
          signal.organizationId,
          signal.branchId
        );
      else
        await this.activityService.recordView(
          signal.userId,
          signal.dataSourceId,
          signal.organizationId,
          signal.branchId
        );
    } catch (error) {
      this.logger.error(
        `data source activity ${signal.kind} failed for data source ${signal.dataSourceId}`,
        error as Error
      );
    }
  }
}
