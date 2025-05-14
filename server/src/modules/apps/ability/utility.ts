import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbility } from './index';
import { defineAppAbility } from './app.ability';
import { defineWorkflowAbility } from './workflow.ability';

export function createAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  resourceId?: string
): void {
  const resourceType = UserAllPermissions.resource[0].resourceType;

  switch (resourceType) {
    case MODULES.APP:
      defineAppAbility(can, UserAllPermissions, resourceId);
      break;
    case MODULES.WORKFLOWS:
      defineWorkflowAbility(can, UserAllPermissions, resourceId);
      break;
    default:
      throw new Error(`Unsupported resource type: ${resourceType}`);
  }
}
