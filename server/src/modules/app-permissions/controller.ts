import { Controller, Get, NotFoundException, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { User } from '@modules/app/decorators/user.decorator';
import { IAppPermissionsController } from './interfaces/IController';
import { FeatureAbilityGuard } from './ability/guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';

@InitModule(MODULES.APP_PERMISSIONS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@Controller('app-permissions')
export class AppPermissionsController implements IAppPermissionsController {
  constructor() {}

  @InitFeature(FEATURE_KEY.FETCH_USERS)
  @Get(':appId/pages/users')
  async fetchUsers(
    @User() user,
    @Param('appId') appId: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.FETCH_USER_GROUPS)
  @Get(':appId/pages/user-groups')
  async fetchUserGroups(
    @User() user,
    @Param('appId') appId: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }
}
