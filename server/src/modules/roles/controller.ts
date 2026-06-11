import { User as UserEntity } from '@entities/user.entity';
import { Body, Controller, Injectable, Put, UseGuards } from '@nestjs/common';
import { RolesService } from './service';
import { User } from '@modules/app/decorators/user.decorator';
import { EditUserRoleDto } from './dto';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '@modules/group-permissions/constants';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '@modules/group-permissions/ability/guard';
import { IRolesController } from './interfaces/IController';
@Injectable()
@Controller({
  path: 'group-permissions',
  version: '2',
})
@InitModule(MODULES.GROUP_PERMISSIONS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class RolesController implements IRolesController {
  constructor(protected roleService: RolesService) {}

  @InitFeature(FEATURE_KEY.USER_ROLE_CHANGE)
  @Put('role/user')
  async updateUserRole(@User() user: UserEntity, @Body() editRoleDto: EditUserRoleDto) {
    editRoleDto.updatingUserId = user.id;
    await this.roleService.updateUserRole(user.organizationId, editRoleDto);
    return;
  }
}
