import { Controller, Post, Body, UseGuards, Param, Get, NotImplementedException } from '@nestjs/common';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';
import { FeatureAbilityGuard } from '../ability/guard';

/* 
  This module is for ai onboarding from the website
  Email and password signup and common ssos - google and git ssos will be supported
*/
@InitModule(MODULES.AUTH)
@Controller('otp')
export class WebsiteOtpController {
  @InitFeature(FEATURE_KEY.AI_MFA_REQUEST_OTP)
  @Get('request-otp/:identifier')
  @UseGuards(FeatureAbilityGuard)
  async requestOtp(@Param('identifier') identifier: string) {
    throw new NotImplementedException();
  }

  @InitFeature(FEATURE_KEY.AI_MFA_VERIFY_OTP)
  @Post('verify-otp/:identifier')
  @UseGuards(FeatureAbilityGuard)
  async verifyOtp(@Param('identifier') identifier: string, @Body() body: { otp: string }) {
    throw new NotImplementedException();
  }
}
