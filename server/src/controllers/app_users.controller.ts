import { Controller, ForbiddenException, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { decamelizeKeys } from 'humps';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { AppUsersService } from '@services/app_users.service';
import { AppsService } from '@services/apps.service';

@Controller('app_users')
export class AppUsersController {
  constructor(
    private appUsersService: AppUsersService,
    private appsService: AppsService,
    private appsAbilityFactory: AppsAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req) {
    const params = req.body;
    const appId = params['app_id'];
    const organizationUserId = params['org_user_id'];
    const { role } = params;

    const app = await this.appsService.find(appId);
    const ability = await this.appsAbilityFactory.appsActions(req.user, { id: appId });

    if (!ability.can('createUsers', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const appUser = await this.appUsersService.create(req.user, appId, organizationUserId, role);
    return decamelizeKeys(appUser);
  }
}
