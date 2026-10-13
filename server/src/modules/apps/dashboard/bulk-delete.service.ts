import { HttpException } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { AppsService } from '@modules/apps/service';
import { AppsRepository } from '@modules/apps/repository';
import { deletable } from './actions';
import { DashboardService } from './dashboard.service';
import { BulkDeleteAppsDto, BulkResultResponseDto, bulkResult } from './dto/bulk.dto';

// Not @Injectable: provided by a factory in apps/module.ts (edition-resolved AppsService / AppsRepository).
export class BulkDeleteService {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly appsService: AppsService,
    private readonly appsRepository: AppsRepository
  ) {}

  async delete(user: User, dto: BulkDeleteAppsDto): Promise<BulkResultResponseDto> {
    const permissions = await this.dashboardService.permissions(user, dto.type);
    const allowed: App[] = [];
    const blockedIds: string[] = [];
    for (const id of dto.app_ids) {
      const app = await this.appsRepository.findById(id, user.organizationId, undefined, dto.branch_id);
      const permitted =
        !!app &&
        app.type === dto.type &&
        deletable(permissions, dto.type, user.id, {
          id: app.id,
          ownerId: app.userId,
          folderId: null,
          currentVersionId: app.currentVersionId,
          isMaintenanceOn: !!app.isMaintenanceOn,
        });
      if (permitted && (await this.passesServiceChecks(app, user, dto.branch_id))) allowed.push(app);
      else blockedIds.push(id);
    }
    const result = bulkResult(
      dto,
      allowed.map((app) => app.id),
      blockedIds
    );
    if (!result.applied) return result;
    let done = 0;
    for (const app of allowed) {
      try {
        await this.appsService.delete(app, user, dto.branch_id);
        done++;
      } catch (error) {
        if (!(error instanceof HttpException)) throw error;
        result.blockedIds.push(app.id);
        result.counts.allowed--;
        result.counts.blocked++;
      }
    }
    result.counts.done = done;
    return result;
  }

  private async passesServiceChecks(app: App, user: User, branchId?: string): Promise<boolean> {
    try {
      await this.appsService.assertDeletable(app, user, branchId);
      return true;
    } catch (error) {
      if (error instanceof HttpException) return false;
      throw error;
    }
  }
}
