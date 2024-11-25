import { Module } from '@nestjs/common';
import { GroupPermissionsControllerV2 } from '@controllers/group_permissions.controller.v2';
import { GroupPermissionsServiceV2 } from '@services/group_permissions.service.v2';
import { GranularPermissionsService } from '@services/granular_permissions.service';
import { UserRoleService } from '@services/user-role.service';
import { GroupPermissionsUtilityService } from './services/group-permissions.utility.service';
import { CaslModule } from '@modules/casl/casl.module';

@Module({
  controllers: [GroupPermissionsControllerV2],
  imports: [CaslModule],
  exports: [UserRoleService, GroupPermissionsServiceV2, GroupPermissionsUtilityService],
  providers: [GroupPermissionsServiceV2, GranularPermissionsService, UserRoleService, GroupPermissionsUtilityService],
})
export class UserResourcePermissionsModule {}
