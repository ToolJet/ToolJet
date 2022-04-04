import { AppAuthenticationDto, AppForgotPasswordDto, AppPasswordResetDto } from '@dto/app-authentication.dto';
import { Controller, Get, Request, Post, UseGuards, Body } from '@nestjs/common';
import { PasswordLoginDisabledGuard } from 'src/modules/auth/password-login-disabled.guard';
import { AuthService } from '../services/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(PasswordLoginDisabledGuard)
  @Post('authenticate')
  async login(@Body() appAuthDto: AppAuthenticationDto) {
    return this.authService.login(appAuthDto);
  }

  @UseGuards(PasswordLoginDisabledGuard)
  @Post('signup')
  async signup(@Body() appAuthDto: AppAuthenticationDto) {
    return this.authService.signup(appAuthDto);
  }

  @Post('/forgot_password')
  async forgotPassword(@Body() appAuthDto: AppForgotPasswordDto) {
    await this.authService.forgotPassword(appAuthDto.email);
    return {};
  }

  @Post('/reset_password')
  async resetPassword(@Body() appAuthDto: AppPasswordResetDto) {
    const { token, password } = appAuthDto;
    await this.authService.resetPassword(token, password);
    return {};
  }

  @Get('/health')
  async healthCheck(@Request() req) {
    return { works: 'yeah' };
  }
}
