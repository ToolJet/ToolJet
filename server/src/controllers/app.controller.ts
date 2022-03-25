import { Controller, Get, Request, Post, UseGuards, Body, Param, BadRequestException } from '@nestjs/common';
import { User } from 'src/decorators/user.decorator';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AuthService } from '../services/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @Post(['authenticate', 'authenticate/:organizationId'])
  async login(@Body() body, @Param('organizationId') organizationId) {
    return this.authService.login({ ...body, organizationId });
  }

  @UseGuards(JwtAuthGuard)
  @Get('switch/:organizationId')
  async switch(@Param('organizationId') organizationId, @User() user) {
    if (!organizationId) {
      throw new BadRequestException();
    }
    return await this.authService.switchOrganization(organizationId, user);
  }

  @Post('signup')
  async signup(@Body() body) {
    return this.authService.signup(body);
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
