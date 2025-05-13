import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbility } from './index';
import { defineAppVersionAbility } from './app-version.ability';
import { defineWorkflowVersionAbility } from './workflow-version.ability';

export function createVersionAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  resourceId?: string
): void {
  const resourceType = UserAllPermissions.resource[0].resourceType;

  switch (resourceType) {
    case MODULES.APP:
      defineAppVersionAbility(can, UserAllPermissions, resourceId);
      break;
    case MODULES.WORKFLOWS:
      defineWorkflowVersionAbility(can, UserAllPermissions, resourceId);
      break;
    default:
      throw new Error(`Unsupported resource type: ${resourceType}`);
  }
}
