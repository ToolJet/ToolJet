// create nestjs controller
import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { SessionService } from '@modules/session/service';
import { Response } from 'express';
import { ISessionController } from '@modules/session/interfaces/IController';
import { SessionAuthGuard } from './guards/session-auth-guard';
import { InvitedUserSessionAuthGuard } from './guards/invited-user-session.guard';
import { InvitedUser } from './decorators/invited-user.decorator';
import { InvitedUserSessionDto } from './dto';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';

@Controller('session')
@InitModule(MODULES.SESSION)
export class SessionController implements ISessionController {
  constructor(protected sessionService: SessionService) {}

  @UseGuards(SessionAuthGuard, FeatureAbilityGuard)
  @Get('logout')
  @InitFeature(FEATURE_KEY.LOG_OUT)
  async terminateUserSession(@User() user: UserEntity, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.sessionService.terminateSession(user.id, user.sessionId, response);
    return;
  }

  @UseGuards(InvitedUserSessionAuthGuard, FeatureAbilityGuard)
  @Post('invited-user-session')
  @InitFeature(FEATURE_KEY.GET_INVITED_USER_SESSION)
  async getInvitedUserSessionDetails(@User() user, @InvitedUser() invitedUser, @Body() tokens: InvitedUserSessionDto) {
    return await this.sessionService.validateInvitedUserSession(user, invitedUser, tokens);
  }

  @UseGuards(SessionAuthGuard, FeatureAbilityGuard)
  @Get()
  @InitFeature(FEATURE_KEY.GET_USER_SESSION)
  getSessionDetails(
    @User() user: UserEntity,
    @Query('appId') appId: string,
    @Query('workspaceSlug') workspaceSlug: string
  ) {
    return this.sessionService.getSessionDetails(user, workspaceSlug, appId);
  }
}
