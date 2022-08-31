import { Controller, Get, Request, Post, UseGuards, Body, Param, BadRequestException } from '@nestjs/common';
import { User } from 'src/decorators/user.decorator';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppAuthenticationDto, AppForgotPasswordDto, AppPasswordResetDto } from '@dto/app-authentication.dto';
import { AuthService } from '../services/auth.service';
import { SignupDisableGuard } from 'src/modules/auth/signup-disable.guard';
import { CreateUserDto } from '@dto/user.dto';
import { AcceptInviteDto } from '@dto/accept-organization-invite.dto';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @Post(['authenticate', 'authenticate/:organizationId'])
  async login(@Request() req, @Body() appAuthDto: AppAuthenticationDto, @Param('organizationId') organizationId) {
    return this.authService.login(req, appAuthDto.email, appAuthDto.password, organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('switch/:organizationId')
  async switch(@Param('organizationId') organizationId, @User() user) {
    if (!organizationId) {
      throw new BadRequestException();
    }
    return await this.authService.switchOrganization(organizationId, user);
  }

  @UseGuards(SignupDisableGuard)
  @Post('set-password-from-token')
  async create(@Request() req, @Body() userCreateDto: CreateUserDto) {
    await this.authService.setupAccountFromInvitationToken(req, userCreateDto);
    return {};
  }

  @Post('accept-invite')
  async acceptInvite(@Request() req, @Body() acceptInviteDto: AcceptInviteDto) {
    await this.authService.acceptOrganizationInvite(req, acceptInviteDto);
    return {};
  }

  @UseGuards(SignupDisableGuard)
  @Post('signup')
  async signup(@Request() req, @Body() appAuthDto: AppAuthenticationDto) {
    return this.authService.signup(req, appAuthDto.email);
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() appAuthDto: AppForgotPasswordDto) {
    await this.authService.forgotPassword(appAuthDto.email);
    return {};
  }

  @Post('/reset-password')
  async resetPassword(@Body() appAuthDto: AppPasswordResetDto) {
    const { token, password } = appAuthDto;
    await this.authService.resetPassword(token, password);
    return {};
  }

  @Get('/health')
  async healthCheck(@Request() req) {
    return { works: 'yeah' };
  }

  @Get('/')
  async rootPage(@Request() req) {
    return { message: 'Instance seems healthy but this is probably not the right URL to access.' };
  }
}
