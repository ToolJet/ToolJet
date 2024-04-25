import { Controller } from '@nestjs/common';
import { GroupPermissionsServiceV2 } from '@services/group_permissions.service.v2';

@Controller({
  path: 'group_permissions',
  version: '2',
})
export class GroupPermissionsControllerV2 {
  constructor(private groupPermissionsService: GroupPermissionsServiceV2) {}
}
