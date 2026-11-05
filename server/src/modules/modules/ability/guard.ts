import { ExecutionContext, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';
import { APP_TYPES } from '@modules/apps/constants';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  // Export takes ids from the body, so resolve which of them are modules in the caller's workspace.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const appIds: string[] = (request.body?.app ?? []).map((app) => app?.id).filter(Boolean);
    const organizationId = request.user?.organizationId;
    request.tj_export_module_ids = [];

    if (appIds.length && organizationId) {
      const modules = await this.dataSource.getRepository(App).find({
        where: { id: In(appIds), organizationId, type: APP_TYPES.MODULE },
        select: ['id'],
      });
      request.tj_export_module_ids = modules.map((module) => module.id);
    }

    return super.canActivate(context);
  }

  protected getResource(): ResourceDetails {
    return {
      resourceType: MODULES.MODULES,
    };
  }

  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }
}
