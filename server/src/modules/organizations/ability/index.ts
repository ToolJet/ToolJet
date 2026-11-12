import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { Organization } from '@entities/organization.entity';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { AuditableRequest } from '@modules/audit-logs/events/types';
import { User } from '@entities/user.entity';

type Subjects = InferSubjects<typeof Organization> | 'all';

const targetsOwnWorkspace = (request: AuditableRequest | undefined, user: User): boolean =>
  !!request?.tj_workspace && request.tj_workspace.id === user.organizationId;

// Status and default are super-admin decisions (archive / set-default on the dashboard).
const changesSuperAdminFields = (request: AuditableRequest | undefined): boolean => {
  const body = (request?.body ?? {}) as { status?: unknown; default?: unknown };
  return body.status !== undefined || body.default !== undefined;
};

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
    UserAllPermissions: UserAllPermissions,
    _extractedMetadata?: { moduleName: string; features: string[] },
    request?: AuditableRequest
  ): Promise<void> {
    const isPersonalWorkspaceAllowed =
      (await this.instanceSettingsUtilService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) === 'true';
    const { superAdmin, isAdmin, user } = UserAllPermissions;

    // Organization listing is available to all (v2 list/get are then limited to the caller's workspaces)
    can([FEATURE_KEY.GET, FEATURE_KEY.LIST_WORKSPACES_V2, FEATURE_KEY.GET_WORKSPACE_V2], Organization);

    if (isPersonalWorkspaceAllowed || superAdmin) {
      // Create is available for all users, controlled by guards
      can([FEATURE_KEY.CREATE, FEATURE_KEY.CHECK_UNIQUE, FEATURE_KEY.CREATE_WORKSPACE_V2], Organization);
    }

    if (isAdmin || superAdmin) {
      // Admin or super admin can do all operations
      can([FEATURE_KEY.UPDATE, FEATURE_KEY.GET, FEATURE_KEY.CHECK_UNIQUE], Organization);
    }

    if (superAdmin || (isAdmin && targetsOwnWorkspace(request, user) && !changesSuperAdminFields(request))) {
      can(FEATURE_KEY.UPDATE_WORKSPACE_V2, Organization);
    }

    if (superAdmin) {
      can(
        [
          FEATURE_KEY.WORKSPACE_ARCHIVE,
          FEATURE_KEY.WORKSPACE_UNARCHIVE,
          FEATURE_KEY.SET_DEFAULT,
          FEATURE_KEY.ARCHIVE_WORKSPACE_V2,
          FEATURE_KEY.UNARCHIVE_WORKSPACE_V2,
          FEATURE_KEY.SET_DEFAULT_WORKSPACE_V2,
        ],
        Organization
      );
    }
  }
}
