import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { FEATURE_KEY, POLICY_FEATURE_KEY } from '../constants';

type AppSubjects = InferSubjects<typeof App> | 'all';
export type AppSecurityAbility = Ability<[FEATURE_KEY, AppSubjects]>;

/*
  Scan results describe an app's code and queries, so they are for the people who can edit the app. Overriding a
  failed gate is a release decision: admins, or editors who also hold the release permission. Only front-end apps are
  scanned; workflows and modules get nothing here.
*/
export function defineAppSecurityAbility(
  can: AbilityBuilder<AppSecurityAbility>['can'],
  permissions: UserAllPermissions,
  appId: string | undefined,
  app: Pick<App, 'type'> | undefined
): void {
  if (app && app.type !== APP_TYPES.FRONT_END) return;
  const { superAdmin, isAdmin, userPermission } = permissions;
  if (superAdmin || isAdmin) {
    can(
      [
        FEATURE_KEY.GET_SCANS,
        FEATURE_KEY.RUN_SCAN,
        FEATURE_KEY.PUBLISH_SCAN,
        FEATURE_KEY.UPLOAD_SCAN_RESULTS,
        FEATURE_KEY.OVERRIDE_GATE,
      ],
      App
    );
    return;
  }
  const appPermissions = userPermission?.[MODULES.APP];
  const canEdit = !!appPermissions?.isAllEditable || !!(appId && appPermissions?.editableAppsId?.includes(appId));
  if (!canEdit) return;
  can([FEATURE_KEY.GET_SCANS, FEATURE_KEY.RUN_SCAN, FEATURE_KEY.PUBLISH_SCAN, FEATURE_KEY.UPLOAD_SCAN_RESULTS], App);
  if (userPermission?.appRelease) can(FEATURE_KEY.OVERRIDE_GATE, App);
}

@Injectable()
export class AppSecurityAbilityFactory extends AbilityFactory<FEATURE_KEY, AppSubjects> {
  protected getSubjectType() {
    return App;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<AppSecurityAbility>['can'],
    permissions: UserAllPermissions,
    _extracted: { moduleName: string; features: string[] },
    request?: { tj_resource_id?: string; tj_app?: App }
  ): void {
    defineAppSecurityAbility(can, permissions, request?.tj_resource_id, request?.tj_app);
  }
}

/** The CASL subject for the workspace's scan policy. */
export class ScanPolicySubject {}

type PolicySubjects = InferSubjects<typeof ScanPolicySubject> | 'all';
export type ScanPolicyAbility = Ability<[POLICY_FEATURE_KEY, PolicySubjects]>;

/** Every member may read the policy their apps are gated by; only admins change it, grant exceptions or see the center. */
export function defineScanPolicyAbility(
  can: AbilityBuilder<ScanPolicyAbility>['can'],
  permissions: UserAllPermissions
): void {
  can(POLICY_FEATURE_KEY.GET_POLICY, ScanPolicySubject);
  if (permissions.superAdmin || permissions.isAdmin) {
    can(
      [
        POLICY_FEATURE_KEY.UPDATE_POLICY,
        POLICY_FEATURE_KEY.LIST_EXCEPTIONS,
        POLICY_FEATURE_KEY.CREATE_EXCEPTION,
        POLICY_FEATURE_KEY.REVOKE_EXCEPTION,
        POLICY_FEATURE_KEY.SECURITY_CENTER,
        POLICY_FEATURE_KEY.RECHECK,
      ],
      ScanPolicySubject
    );
  }
}

@Injectable()
export class ScanPolicyAbilityFactory extends AbilityFactory<POLICY_FEATURE_KEY, PolicySubjects> {
  protected getSubjectType() {
    return ScanPolicySubject;
  }

  protected defineAbilityFor(can: AbilityBuilder<ScanPolicyAbility>['can'], permissions: UserAllPermissions): void {
    defineScanPolicyAbility(can, permissions);
  }
}
