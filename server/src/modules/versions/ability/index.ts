import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';
import { createVersionAbility } from './utility';
import { AppsRepository } from '@modules/apps/repository';
import { MODULES } from '@modules/app/constants/modules';

type Subjects = InferSubjects<typeof App> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  constructor(
    protected abilityService: AbilityService,
    private readonly appsRepository: AppsRepository
  ) {
    super(abilityService);
  }

  protected getSubjectType() {
    return App;
  }

  protected async defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): Promise<void> {
    const resourceId = request?.tj_resource_id;
    const resourceType = UserAllPermissions?.resource?.[0]?.resourceType;

    let isEmbeddedInEditableParentApp = false;
    if (resourceType === MODULES.MODULES && !UserAllPermissions.isAdmin && !UserAllPermissions.superAdmin) {
      const parentAppId: string | undefined = request?.query?.parentAppId;
      const moduleApp: App = request?.tj_app;
      if (parentAppId && moduleApp?.co_relation_id) {
        const appPermissions = UserAllPermissions.userPermission?.[MODULES.APP];
        const canEditParentApp =
          !!appPermissions?.isAllEditable || !!appPermissions?.editableAppsId?.includes(parentAppId);
        if (canEditParentApp) {
          isEmbeddedInEditableParentApp = await this.appsRepository.isModuleEmbeddedInApp(
            moduleApp.co_relation_id,
            parentAppId
          );
        }
      }
    }

    createVersionAbility(can, UserAllPermissions, resourceId, isEmbeddedInEditableParentApp);
  }
}
