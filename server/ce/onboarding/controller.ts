import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CreateAdminDto } from '@dto/user.dto';
import { FirstUserSignupGuard } from 'src/modules/auth/first-user-signup.guard';
import { OnboardingService } from './service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @UseGuards(FirstUserSignupGuard)
  @Post('setup-first-user')
  async setupFirstUser(@Body() userCreateDto: CreateAdminDto, @Res({ passthrough: true }) response: Response) {
    return await this.onboardingService.setupFirstUser(response, userCreateDto);
  }
}
