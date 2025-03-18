import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects, SubjectType } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../../constants';
import { DataSource } from '@entities/data_source.entity';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';

type Subjects = InferSubjects<typeof App> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return App;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin, userPermission, isBuilder } = UserAllPermissions;

    const resourcePermissions = userPermission?.[MODULES.APP];
    const isAllEditable = !!resourcePermissions?.isAllEditable;
    const isCanCreate = userPermission.appCreate;
    const isCanDelete = userPermission.appDelete;
    const isAllViewable = !!resourcePermissions?.isAllViewable;

    //if (isAdmin || superAdmin) {
    // Admin or super admin and do all operations
    can(
      [
        FEATURE_KEY.CREATE,
        FEATURE_KEY.GET,
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.DELETE,
        FEATURE_KEY.UPDATE_DATA_SOURCE,
        FEATURE_KEY.UPDATE_ONE,
        FEATURE_KEY.RUN_EDITOR,
        FEATURE_KEY.RUN_VIEWER,
        FEATURE_KEY.PREVIEW,
      ],
      App
    );
    return;
    //}
  }
}
