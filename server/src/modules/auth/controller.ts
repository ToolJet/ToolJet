import { Controller, Get, Post, Body, Param, BadRequestException, Res, UseGuards } from '@nestjs/common';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constants';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { User } from '@modules/app/decorators/user.decorator';
import { AppAuthenticationDto, AppForgotPasswordDto, AppPasswordResetDto } from './dto';
import { AuthService } from './service';
import { Response } from 'express';
import { AuthorizeWorkspaceGuard } from './guards/authorize-workspace-guard';
import { SwitchWorkspaceAuthGuard } from './guards/switch-workspace.guard';
import { FeatureAbilityGuard } from './ability/guard';
import { IAuthController } from './interfaces/IController';

@Controller()
@InitModule(MODULES.AUTH)
@UseGuards(FeatureAbilityGuard)
export class AuthController implements IAuthController {
  constructor(protected authService: AuthService) {}

  @Post('authenticate')
  @InitFeature(FEATURE_KEY.LOGIN)
  async login(@Body() appAuthDto: AppAuthenticationDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(response, appAuthDto);
  }

  @Post('authenticate/super-admin')
  @InitFeature(FEATURE_KEY.SUPER_ADMIN_LOGIN)
  async superAdminLogin(@Body() appAuthDto: AppAuthenticationDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.superAdminLogin(response, appAuthDto);
  }

  @Post('authenticate/:organizationId')
  @InitFeature(FEATURE_KEY.ORGANIZATION_LOGIN)
  async organizationLogin(
    @User() user,
    @Body() appAuthDto: AppAuthenticationDto,
    @Param('organizationId') organizationId,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.authService.login(response, appAuthDto, organizationId, user);
  }

  @Get('authorize')
  @InitFeature(FEATURE_KEY.AUTHORIZE)
  @UseGuards(AuthorizeWorkspaceGuard)
  async authorize(@User() user) {
    return this.authService.authorizeOrganization(user);
  }

  @Get('switch/:organizationId')
  @InitFeature(FEATURE_KEY.SWITCH_WORKSPACE)
  @UseGuards(SwitchWorkspaceAuthGuard)
  async switchWorkspace(
    @Param('organizationId') organizationId,
    @User() user,
    @Res({ passthrough: true }) response: Response
  ) {
    if (!organizationId) {
      throw new BadRequestException();
    }
    return this.authService.switchOrganization(response, organizationId, user);
  }

  @Post('/forgot-password')
  @InitFeature(FEATURE_KEY.FORGOT_PASSWORD)
  async forgotPassword(@Body() appAuthDto: AppForgotPasswordDto) {
    await this.authService.forgotPassword(appAuthDto.email);
    return {};
  }

  @Post('/reset-password')
  @InitFeature(FEATURE_KEY.RESET_PASSWORD)
  async resetPassword(@Body() appAuthDto: AppPasswordResetDto) {
    const { token, password } = appAuthDto;
    await this.authService.resetPassword(token, password);
    return {};
  }
}
