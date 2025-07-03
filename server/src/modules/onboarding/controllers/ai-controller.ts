import { Controller, Post, Body, Res, UseGuards, Param, Get } from '@nestjs/common';
import { CreateAiUserDto } from './dto/create-ai-user.dto';
import { Response } from 'express';
import { OrganizationAuthGuard } from 'src/modules/auth/organization-auth.guard';
import { SSOType } from '@entities/sso_config.entity';
import { User } from 'src/decorators/user.decorator';
import { SignupDisableGuard } from '@modules/auth/signup-disable.guard';
import { FirstUserSignupDisableGuard } from '@modules/auth/first-user-signup-disable.guard';
import { AllowPersonalWorkspaceGuard } from '@ee/instance-settings/guards/personal-workspace.guard';
import { AiCookies } from 'src/decorators/ai-cookies.decorators';
import { IAiOnboardingController, IOnboardingController } from '../interfaces/IController';
import { OnboardingService } from '../service';
import { AiOnboardingService } from '../services/ai-onboarding.service';

/* 
  This module is for ai onboarding from the website
  Email and password signup and common ssos - google and git ssos will be supported
*/
@Controller('ai/onboarding')
export class AiOnboardingController implements IAiOnboardingController {
  constructor(private readonly aiOnboardingService: AiOnboardingService) {}

  @UseGuards(SignupDisableGuard, AllowPersonalWorkspaceGuard, FirstUserSignupDisableGuard)
  @Post()
  async onboard(@Body() onboardingData: CreateAiUserDto, @Res({ passthrough: true }) response: Response) {
    return this.aiOnboardingService.handleOnboarding(onboardingData, null, response);
  }

  @UseGuards(OrganizationAuthGuard)
  @Post('sign-in/common/:ssoType')
  async commonSignIn(
    @Param('ssoType') ssoType: SSOType.GOOGLE | SSOType.GIT,
    @Body() body,
    @User() user,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.aiOnboardingService.handleOnboarding(body, user, response, ssoType);
  }

  /* Incase if we need to support the safari browsers */
  @Post('set-ai-cookie')
  async setAiCookie(@Res({ passthrough: true }) response: Response, @Body() body: Record<string, any>) {
    return this.aiOnboardingService.setSessionAICookies(response, body);
  }

  @Get('delete-ai-cookies')
  async deleteAiCookies(@Res({ passthrough: true }) response: Response, @AiCookies() cookies: Record<string, any>) {
    return this.aiOnboardingService.clearSessionAICookies(response, cookies);
  }
}
