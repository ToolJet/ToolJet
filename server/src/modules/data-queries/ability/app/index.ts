import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../../constants';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { defineDataQueryAppAbility } from './data-query-app.ability';
import { defineDataQueryWorkflowAbility } from './data-query-workflow.ability';

type Subjects = InferSubjects<typeof App> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return App;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    defineAppQueryAbility(can, UserAllPermissions, request?.tj_app as App, request?.tj_resource_id);
  }
}

// Query permissions of the user on one app, module or workflow. Query folders reuse it, so
// folders and queries can never disagree on who may edit.
export function defineAppQueryAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  app: App,
  resourceId?: string
): void {
  const resourceType = UserAllPermissions.resource[0].resourceType;

  switch (resourceType) {
    case MODULES.APP:
    case MODULES.MODULES:
      defineDataQueryAppAbility(can, UserAllPermissions, app);
      break;
    case MODULES.WORKFLOWS:
      defineDataQueryWorkflowAbility(can, UserAllPermissions, resourceId);
      break;
    default:
      throw new Error(`Unsupported resource type: ${resourceType}`);
  }
}
