import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { Organization } from '@entities/organization.entity';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';

type Subjects = InferSubjects<typeof Organization> | 'all';
export type OrganizationAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  constructor(
    protected readonly instanceSettingsUtilService: InstanceSettingsUtilService,
    protected readonly abilityService: AbilityService
  ) {
    super(abilityService);
  }
  protected getSubjectType() {
    return Organization;
  }

  protected async defineAbilityFor(
    can: AbilityBuilder<OrganizationAbility>['can'],
    UserAllPermissions: UserAllPermissions
  ): Promise<void> {
    const isPersonalWorkspaceAllowed =
      (await this.instanceSettingsUtilService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) === 'true';
    const { superAdmin, isAdmin } = UserAllPermissions;

    // Organization listing is available to all
    can(FEATURE_KEY.GET, Organization);

    if (isPersonalWorkspaceAllowed || superAdmin) {
      // Create is available for all users, controlled by guards
      can([FEATURE_KEY.CREATE, FEATURE_KEY.CHECK_UNIQUE], Organization);
    }

    if (isAdmin || superAdmin) {
      // Admin or super admin can do all operations
      can([FEATURE_KEY.UPDATE, FEATURE_KEY.GET, FEATURE_KEY.CHECK_UNIQUE], Organization);
    }
    if (superAdmin) {
      can([FEATURE_KEY.WORKSPACE_STATUS_UPDATE], Organization);
    }
  }
}
