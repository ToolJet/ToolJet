import { Controller, Get, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constants';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { JwtAuthGuard } from '../session/guards/jwt-auth.guard';
import { OnboardingService } from './service';
import { Response } from 'express';
import { FirstUserSignupDisableGuard } from './guards/first-user-signup-disable.guard';
import { SessionAuthGuard } from '@modules/session/guards/session-auth-guard';
import { OnboardingCompletedDto } from './dto';
import { ActivateAccountWithTokenDto } from './dto/activate-account-with-token.dto';
import { CreateAdminDto, OnboardUserDto } from '@modules/onboarding/dto/user.dto';
import { AcceptInviteDto } from './dto/accept-organization-invite.dto';
import { AppSignupDto } from '@modules/auth/dto';
import { SignupDisableGuard } from './guards/signup-disable.guard';
import { AllowPersonalWorkspaceGuard } from './guards/personal-workspace.guard';
import { FirstUserSignupGuard } from './guards/first-user-signup.guard';
import { UserCountGuard } from '@modules/licensing/guards/user.guard';
import { EditorUserCountGuard } from '@modules/licensing/guards/editorUser.guard';
import { OrganizationInviteAuthGuard } from './guards/organization-invite-auth.guard';
import { FeatureAbilityGuard } from './ability/guard';
import { IOnboardingController } from './interfaces/IController';

@Controller('onboarding')
@InitModule(MODULES.ONBOARDING)
export class OnboardingController implements IOnboardingController {
  constructor(protected onboardingService: OnboardingService) {}

  @InitFeature(FEATURE_KEY.ACTIVATE_ACCOUNT)
  @UseGuards(SignupDisableGuard, FirstUserSignupDisableGuard, FeatureAbilityGuard)
  @Post('activate-account-with-token')
  async activateAccountWithToken(
    @Body() activateAccountDto: ActivateAccountWithTokenDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.onboardingService.activateAccountWithToken(activateAccountDto, response);
  }

  @InitFeature(FEATURE_KEY.SETUP_SUPER_ADMIN)
  @UseGuards(FirstUserSignupGuard, FeatureAbilityGuard)
  @Post('setup-super-admin')
  async setupSuperAdmin(@Body() userCreateDto: CreateAdminDto, @Res({ passthrough: true }) response: Response) {
    return this.onboardingService.setupFirstUser(response, userCreateDto);
  }

  @InitFeature(FEATURE_KEY.SIGNUP)
  @UseGuards(
    SignupDisableGuard,
    AllowPersonalWorkspaceGuard,
    UserCountGuard,
    EditorUserCountGuard,
    FirstUserSignupDisableGuard,
    FeatureAbilityGuard
  )
  @Post('signup')
  async signup(@Body() appSignupDto: AppSignupDto) {
    return this.onboardingService.signup(appSignupDto);
  }

  @InitFeature(FEATURE_KEY.ACCEPT_INVITE)
  @UseGuards(FirstUserSignupDisableGuard, OrganizationInviteAuthGuard, FeatureAbilityGuard)
  @Post('accept-invite')
  async acceptInvite(
    @User() user: UserEntity,
    @Body() acceptInviteDto: AcceptInviteDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.onboardingService.acceptOrganizationInvite(response, user, acceptInviteDto);
  }

  @InitFeature(FEATURE_KEY.RESEND_INVITE)
  @UseGuards(SignupDisableGuard, FirstUserSignupDisableGuard, FeatureAbilityGuard)
  @Post('resend-invite')
  async resendInvite(@Body() body: AppSignupDto) {
    return this.onboardingService.resendEmail(body);
  }

  @InitFeature(FEATURE_KEY.VERIFY_INVITE_TOKEN)
  @UseGuards(FirstUserSignupDisableGuard, FeatureAbilityGuard)
  @Get('verify-invite-token')
  async verifyInviteToken(@Query('token') token: string, @Query('organizationToken') organizationToken: string) {
    return this.onboardingService.verifyInviteToken(token, organizationToken);
  }

  @InitFeature(FEATURE_KEY.SETUP_ACCOUNT_FROM_TOKEN)
  @UseGuards(FirstUserSignupDisableGuard, FeatureAbilityGuard)
  @Post('setup-account-from-token')
  async setupAccountFromToken(@Body() onboardUserDto: OnboardUserDto, @Res({ passthrough: true }) response: Response) {
    return this.onboardingService.setupAccountFromInvitationToken(response, onboardUserDto);
  }

  @InitFeature(FEATURE_KEY.REQUEST_TRIAL)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get('request-trial')
  async requestTrial(@User() user: UserEntity) {
    throw new Error('Not implemented');
  }

  @InitFeature(FEATURE_KEY.TRIAL_DECLINED)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get('trial-declined')
  async trialDeclined(@User() user: UserEntity) {
    throw new Error('Not implemented');
  }

  @InitFeature(FEATURE_KEY.ACTIVATE_TRIAL)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('activate-trial')
  async activateTrial() {
    throw new Error('Not implemented');
  }

  @InitFeature(FEATURE_KEY.GET_INVITEE_DETAILS)
  @UseGuards(FeatureAbilityGuard)
  @Get('invitee-details')
  async getInviteeDetails(@Query('token') token) {
    return await this.onboardingService.getInviteeDetails(token);
  }

  @InitFeature(FEATURE_KEY.VERIFY_ORGANIZATION_TOKEN)
  @UseGuards(FirstUserSignupDisableGuard, FeatureAbilityGuard)
  @Get('verify-organization-token')
  async verifyOrganizationToken(@Query('token') token) {
    return await this.onboardingService.verifyOrganizationToken(token);
  }

  @InitFeature(FEATURE_KEY.GET_ONBOARDING_SESSION)
  @UseGuards(SessionAuthGuard, FeatureAbilityGuard)
  @Get('session')
  async getOnboardingDetails(@User() user: UserEntity) {
    return await this.onboardingService.getSuperAdminOnboardingDetails(user);
  }

  @InitFeature(FEATURE_KEY.GET_SIGNUP_ONBOARDING_SESSION)
  @UseGuards(SessionAuthGuard, FeatureAbilityGuard)
  @Get('signup-session')
  async getSignupOnboardingDetails(@User() user: UserEntity) {
    return await this.onboardingService.getSignupUserOnboardingDetails(user);
  }

  @InitFeature(FEATURE_KEY.FINISH_ONBOARDING)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('finish')
  async finishOnboarding(@User() user: UserEntity, @Body() body: OnboardingCompletedDto) {
    return await this.onboardingService.finishOnboarding(user, body);
  }

  // API to check if a workspace name is available (Used for super admin onboarding; does not require a JWT token)
  @InitFeature(FEATURE_KEY.CHECK_WORKSPACE_UNIQUENESS)
  @UseGuards(FeatureAbilityGuard)
  @Get('/workspace-name/unique')
  async checkUniqueWorkspaceName(@User() user, @Query('name') name: string) {
    return this.onboardingService.checkWorkspaceNameUniqueness(name);
  }
}
