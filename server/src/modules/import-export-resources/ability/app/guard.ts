import { ExecutionContext, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { FeatureAbilityFactory } from '.';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { ResourceDetails } from '@modules/app/types';
import { APP_TYPES } from '@modules/apps/constants';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }

  // Export authorizes per resource type, so resolve each requested id's type in the caller's
  // workspace before the ability runs. Ids outside the workspace stay unresolved and are denied.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const appIds: string[] = (request.body?.app ?? []).map((app) => app?.id).filter(Boolean);
    const organizationId = request.user?.organizationId;
    request.tj_export_app_types = {};

    if (appIds.length && organizationId) {
      const apps = await this.dataSource.getRepository(App).find({
        where: { id: In(appIds), organizationId },
        select: ['id', 'type'],
      });
      request.tj_export_app_types = Object.fromEntries(apps.map((app) => [app.id, app.type]));
    }

    return super.canActivate(context);
  }

  protected getResource(request?: any): ResourceDetails[] {
    const types = new Set(Object.values(request?.tj_export_app_types ?? {}));
    return [
      { resourceType: MODULES.APP },
      ...(types.has(APP_TYPES.WORKFLOW) ? [{ resourceType: MODULES.WORKFLOWS }] : []),
      ...(types.has(APP_TYPES.MODULE) ? [{ resourceType: MODULES.MODULES }] : []),
      { resourceType: MODULES.GLOBAL_DATA_SOURCE },
    ];
  }
}
