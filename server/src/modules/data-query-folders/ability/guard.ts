import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { DataQueryFolder } from '@entities/data_query_folder.entity';
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
    return DataQueryFolder;
  }

  // Read from the request: guard instances are shared across requests.
  protected getResource(request?: { tj_app?: App }): ResourceDetails | undefined {
    const app = request?.tj_app;
    if (!app) return undefined;
    const resourceType =
      app.type === APP_TYPES.MODULE
        ? MODULES.MODULES
        : app.type === APP_TYPES.WORKFLOW
          ? MODULES.WORKFLOWS
          : MODULES.APP;
    return { resourceType };
  }
}
