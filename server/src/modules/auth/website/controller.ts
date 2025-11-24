import { Controller, Post, Body, Res, UseGuards, Param, Get, NotImplementedException } from '@nestjs/common';
import { Response } from 'express';
import { SSOType } from '@entities/sso_config.entity';
import { IWebsiteAuthController } from '../interfaces/IController';
import { CreateAiUserDto } from '../dto';
import { OrganizationAuthGuard } from '@modules/session/guards/organization-auth.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';
import { AiCookies } from '../decorators/ai-cookie.decorator';
import { FeatureAbilityGuard } from '../ability/guard';

/* 
  This module is for ai onboarding from the website
  Email and password signup and common ssos - google and git ssos will be supported
*/
@InitModule(MODULES.AUTH)
@Controller('ai/onboarding')
export class WebsiteAuthController implements IWebsiteAuthController {
  @InitFeature(FEATURE_KEY.AI_ONBOARDING)
  @UseGuards(FeatureAbilityGuard)
  @Post()
  async onboard(@Body() onboardingData: CreateAiUserDto, @Res({ passthrough: true }) response: Response) {
    throw new NotImplementedException();
  }

  @InitFeature(FEATURE_KEY.AI_ONBOARDING_SSO)
  @UseGuards(OrganizationAuthGuard, FeatureAbilityGuard)
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
  @InitFeature(FEATURE_KEY.AI_COOKIE_SET)
  @Post('set-ai-cookie')
  @UseGuards(FeatureAbilityGuard)
  setAiCookie(@Res({ passthrough: true }) response: Response, @Body() body: Record<string, any>) {
    throw new NotImplementedException();
  }

  @InitFeature(FEATURE_KEY.AI_COOKIE_DELETE)
  @Get('delete-ai-cookies')
  @UseGuards(FeatureAbilityGuard)
  deleteAiCookies(@Res({ passthrough: true }) response: Response, @AiCookies() cookies: Record<string, any>) {
    throw new NotImplementedException();
  }
}
