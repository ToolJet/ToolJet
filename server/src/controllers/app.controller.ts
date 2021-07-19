import { Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { AuthService } from '../services/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @Post('authenticate')
  async login(@Request() req) {
    return this.authService.login(req.body);
  }

  @Post('signup')
  async signup(@Request() req) {
    return this.authService.signup(req.body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.body;
  }
}
