import { Controller, Post, Body, Res, UseGuards, Param, Get, NotImplementedException } from '@nestjs/common';
import { Response } from 'express';
import { SSOType } from '@entities/sso_config.entity';
import { IAiOnboardingController } from '../interfaces/IController';
import { AiOnboardingService } from '../services/ai-onboarding.service';
import { CreateAiUserDto } from '../dto';
import { OrganizationAuthGuard } from '@modules/session/guards/organization-auth.guard';
import { SignupDisableGuard } from '../guards/signup-disable.guard';
import { AllowPersonalWorkspaceGuard } from '../guards/personal-workspace.guard';
import { FirstUserSignupDisableGuard } from '../guards/first-user-signup-disable.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { AiCookies } from '../decorators/ai-cookie.decorator';

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
    throw new NotImplementedException();
  }

  @UseGuards(OrganizationAuthGuard)
  @Post('sign-in/common/:ssoType')
  async commonSignIn(
    @Param('ssoType') ssoType: SSOType.GOOGLE | SSOType.GIT,
    @Body() body,
    @User() user,
    @Res({ passthrough: true }) response: Response
  ) {
    throw new NotImplementedException();
  }

  /* Incase if we need to support the safari browsers */
  @Post('set-ai-cookie')
  async setAiCookie(@Res({ passthrough: true }) response: Response, @Body() body: Record<string, any>) {
    throw new NotImplementedException();
  }

  @Get('delete-ai-cookies')
  async deleteAiCookies(@Res({ passthrough: true }) response: Response, @AiCookies() cookies: Record<string, any>) {
    throw new NotImplementedException();
  }
}
