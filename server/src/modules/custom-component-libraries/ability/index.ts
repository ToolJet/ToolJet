import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { CustomComponentLibrary } from '@entities/custom_component_library.entity';

type Subjects = InferSubjects<typeof CustomComponentLibrary> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return CustomComponentLibrary;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin, isBuilder } = UserAllPermissions;

    // Read/serve endpoints stay open to everyone, including end users — an app with a
    // CCL component needs GET_LIBRARY/LIST_LIBRARIES/SERVE_BUNDLE to render for its viewers.
    can([FEATURE_KEY.GET_LIBRARY, FEATURE_KEY.LIST_LIBRARIES, FEATURE_KEY.SERVE_BUNDLE], CustomComponentLibrary);

    // Publishing/authoring a library (CLI upload, dev preview, release) is a builder
    // action, same tier as everything else the CLI/editor lets a workspace member do.
    if (superAdmin || isAdmin || isBuilder) {
      can(
        [
          FEATURE_KEY.CREATE_LIBRARY,
          FEATURE_KEY.FIND_OR_CREATE_LIBRARY,
          FEATURE_KEY.UPLOAD_DEV_BUNDLE,
          FEATURE_KEY.STREAM_DEV_BUNDLE,
          FEATURE_KEY.PUBLISH_REVISION,
        ],
        CustomComponentLibrary
      );
    }

    // DELETE_LIBRARY is the one destructive admin-page op — backend matches the AdminRoute UI.
    if (isAdmin || superAdmin) {
      can([FEATURE_KEY.DELETE_LIBRARY], CustomComponentLibrary);
    }
  }
}
