import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, AbilityClass, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { DataQueryFolder } from '@entities/data_query_folder.entity';
import { App } from '@entities/app.entity';
import { FEATURE_KEY as QUERY_FEATURE_KEY } from '@modules/data-queries/constants';
import { defineAppQueryAbility, FeatureAbility as QueryAbility } from '@modules/data-queries/ability/app';

type Subjects = InferSubjects<typeof DataQueryFolder> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return DataQueryFolder;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    _extractedMetadata: { moduleName: string; features: string[] },
    request?: { tj_app?: App; tj_resource_id?: string }
  ): void {
    const { superAdmin, isAdmin, isBuilder } = UserAllPermissions;

    // The scope guard resolved the app the request targets: folders follow that app's query permissions.
    if (request?.tj_app) {
      const queries = new AbilityBuilder<QueryAbility>(Ability as AbilityClass<QueryAbility>);
      defineAppQueryAbility(queries.can, UserAllPermissions, request.tj_app, request.tj_resource_id);
      const queryAbility = queries.build();
      if (queryAbility.can(QUERY_FEATURE_KEY.UPDATE_ONE, App)) {
        can(
          [FEATURE_KEY.CREATE, FEATURE_KEY.GET, FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE, FEATURE_KEY.REORDER],
          DataQueryFolder
        );
      } else if (queryAbility.can(QUERY_FEATURE_KEY.GET, App)) {
        can([FEATURE_KEY.GET], DataQueryFolder);
      }
      return;
    }

    if (superAdmin || isAdmin || isBuilder) {
      can(
        [FEATURE_KEY.CREATE, FEATURE_KEY.GET, FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE, FEATURE_KEY.REORDER],
        DataQueryFolder
      );
      return;
    }

    can([FEATURE_KEY.GET], DataQueryFolder);
  }
}
