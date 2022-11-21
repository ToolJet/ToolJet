import { Controller, Get, Request, Post, UseGuards, Body, Param, BadRequestException, Query } from '@nestjs/common';
import { User } from 'src/decorators/user.decorator';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import {
  AppAuthenticationDto,
  AppForgotPasswordDto,
  AppPasswordResetDto,
  AppSignupDto,
} from '@dto/app-authentication.dto';
import { AuthService } from '../services/auth.service';
import { SignupDisableGuard } from 'src/modules/auth/signup-disable.guard';
import { CreateUserDto } from '@dto/user.dto';
import { AcceptInviteDto } from '@dto/accept-organization-invite.dto';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @Post(['authenticate', 'authenticate/:organizationId'])
  async login(@Body() appAuthDto: AppAuthenticationDto, @Param('organizationId') organizationId) {
    return this.authService.login(appAuthDto.email, appAuthDto.password, organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('switch/:organizationId')
  async switch(@Param('organizationId') organizationId, @User() user) {
    if (!organizationId) {
      throw new BadRequestException();
    }
    return await this.authService.switchOrganization(organizationId, user);
  }

  @Post('setup-account-from-token')
  async create(@Body() userCreateDto: CreateUserDto) {
    return await this.authService.setupAccountFromInvitationToken(userCreateDto);
  }

  @Post('accept-invite')
  async acceptInvite(@Body() acceptInviteDto: AcceptInviteDto) {
    return await this.authService.acceptOrganizationInvite(acceptInviteDto);
  }

  @UseGuards(SignupDisableGuard)
  @Post('signup')
  async signup(@Body() appAuthDto: AppSignupDto) {
    return this.authService.signup(appAuthDto.email, appAuthDto.name, appAuthDto.password);
  }

  @UseGuards(SignupDisableGuard)
  @Post('resend-invite')
  async resendInvite(@Body('email') email: string) {
    return this.authService.resendEmail(email);
  }

  @Get('verify-invite-token')
  async verifyInviteToken(@Query('token') token, @Query('organizationToken') organizationToken) {
    return await this.authService.verifyInviteToken(token, organizationToken);
  }

  @Get('verify-organization-token')
  async verifyOrganizationToken(@Query('token') token) {
    return await this.authService.verifyOrganizationToken(token);
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

  @Get(['/health', '/api/health'])
  async healthCheck(@Request() req) {
    return { works: 'yeah' };
  }

  @Get('/')
  async rootPage(@Request() req) {
    return { message: 'Instance seems healthy but this is probably not the right URL to access.' };
  }
}
