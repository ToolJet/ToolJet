import { Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { PasswordLoginDisabledGuard } from 'src/modules/auth/password-login-disabled.guard';
import { AuthService } from '../services/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(PasswordLoginDisabledGuard)
  @Post('authenticate')
  async login(@Request() req) {
    return this.authService.login(req.body);
  }

  @UseGuards(PasswordLoginDisabledGuard)
  @Post('signup')
  async signup(@Request() req) {
    return this.authService.signup(req.body);
  }

  @Post('/forgot_password')
  async forgotPassword(@Request() req) {
    await this.authService.forgotPassword(req.body.email);
    return {};
  }

  @Post('/reset_password')
  async resetPassword(@Request() req) {
    const { token, password } = req.body;
    await this.authService.resetPassword(token, password);
    return {};
  }

  @Get('/health')
  async healthCheck(@Request() req) {
    return { works: 'yeah' };
  }

  // TODO: Added to debug intermittent failures when paired with proxy
  @Post('/health')
  async postHealthCheck(@Request() req) {
    return { works: 'yeah' };
  }
}
