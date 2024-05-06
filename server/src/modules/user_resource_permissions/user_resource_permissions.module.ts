import { Module } from '@nestjs/common';
import { GroupPermissionsControllerV2 } from '@controllers/group_permissions.controller.v2';
import { GroupPermissionsServiceV2 } from '@services/group_permissions.service.v2';
import { GranularPermissionsService } from '@services/granular_permissions.service';
import { UserRoleService } from '@services/user-role.service';

@Module({
  controllers: [GroupPermissionsControllerV2],
  imports: [],
  providers: [GroupPermissionsServiceV2, GranularPermissionsService, UserRoleService],
})
export class UserResourcePermissionsModule {}
