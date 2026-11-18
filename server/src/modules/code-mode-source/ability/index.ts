import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';
import { FEATURE_KEY } from '../constants';

type Subjects = InferSubjects<typeof App> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

/**
 * Source follows the app's own permissions: whoever can edit the app reads and writes its source; a builder who can
 * only view the app reads it (the editor shows it read-only). End users never reach the source through this API.
 */
@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return App;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    permissions: UserAllPermissions,
    _metadata?: unknown,
    request?: any
  ): void {
    const { superAdmin, isAdmin, isBuilder, userPermission } = permissions;
    const appId: string | undefined = request?.tj_resource_id;
    const write = [
      FEATURE_KEY.GET_SOURCE,
      FEATURE_KEY.LIST_REVISIONS,
      FEATURE_KEY.WRITE_SOURCE,
      FEATURE_KEY.IMPORT_SOURCE,
      FEATURE_KEY.UPLOAD_DEV_BUNDLE,
      FEATURE_KEY.PUBLISH_CODE,
    ];
    if (superAdmin || isAdmin) {
      can(write, App);
      return;
    }
    const apps = userPermission?.[MODULES.APP];
    const canEdit = !!apps?.isAllEditable || (!!appId && !!apps?.editableAppsId?.includes(appId));
    if (canEdit) {
      can(write, App);
      return;
    }
    const canView = !!apps?.isAllViewable || (!!appId && !!apps?.viewableAppsId?.includes(appId));
    if (isBuilder && canView) can([FEATURE_KEY.GET_SOURCE, FEATURE_KEY.LIST_REVISIONS], App);
  }
}
