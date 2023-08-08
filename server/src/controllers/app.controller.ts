import {
  Controller,
  Get,
  Request,
  Post,
  UseGuards,
  Body,
  Param,
  BadRequestException,
  Query,
  Res,
  NotFoundException,
} from '@nestjs/common';
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
import { CreateAdminDto, CreateUserDto } from '@dto/user.dto';
import { AcceptInviteDto } from '@dto/accept-organization-invite.dto';
import { FirstUserSignupDisableGuard } from 'src/modules/auth/first-user-signup-disable.guard';
import { FirstUserSignupGuard } from 'src/modules/auth/first-user-signup.guard';
import { OrganizationAuthGuard } from 'src/modules/auth/organization-auth.guard';
import { AuthorizeWorkspaceGuard } from 'src/modules/auth/authorize-workspace-guard';
import { Response } from 'express';
import { SessionAuthGuard } from 'src/modules/auth/session-auth-guard';
import { UsersService } from '@services/users.service';
import { SessionService } from '@services/session.service';
import { OrganizationsService } from '@services/organizations.service';

@Controller()
export class AppController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
    private sessionService: SessionService,
    private organizationService: OrganizationsService
  ) {}

  @Post('authenticate')
  async login(@Body() appAuthDto: AppAuthenticationDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(response, appAuthDto.email, appAuthDto.password);
  }

  @UseGuards(OrganizationAuthGuard)
  @Post('authenticate/:organizationId')
  async organizationLogin(
    @User() user,
    @Body() appAuthDto: AppAuthenticationDto,
    @Param('organizationId') organizationId,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.authService.login(response, appAuthDto.email, appAuthDto.password, organizationId, user);
  }

  @UseGuards(SessionAuthGuard)
  @Get('session')
  async getSessionDetails(@User() user, @Query('appId') appId: string, @Query('workspaceSlug') workspaceSlug: string) {
    let organizationId: string;
    let app: any;
    if (appId) {
      app = await this.userService.returnOrgIdOfAnApp(appId);
      //if the user has a session and the app is public, we don't need to authorize the app organization id
      if (!app?.isPublic) organizationId = app.organizationId;
    } else if (workspaceSlug) {
      const id = await this.organizationService.fetchOrganizationId(workspaceSlug);
      if (!id) {
        throw new NotFoundException("Coudn't found workspace. workspace id or slug is incorrect!.");
      }
      organizationId = id;
    }
    if (organizationId && user.organizationIds?.includes(organizationId)) {
      user.organization_id = organizationId;
    }
    return this.authService.generateSessionPayload(user, organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async terminateUserSession(@User() user, @Res({ passthrough: true }) response: Response) {
    await this.sessionService.terminateSession(user.id, user.sessionId, response);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getUserDetails(@User() user) {
    return this.sessionService.getSessionUserDetails(user);
  }

  @UseGuards(AuthorizeWorkspaceGuard)
  @Get('authorize')
  async authorize(@User() user) {
    return await this.authService.authorizeOrganization(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('switch/:organizationId')
  async switch(@Param('organizationId') organizationId, @User() user, @Res({ passthrough: true }) response: Response) {
    if (!organizationId) {
      throw new BadRequestException();
    }
    return await this.authService.switchOrganization(response, organizationId, user);
  }

  @UseGuards(FirstUserSignupGuard)
  @Post('setup-admin')
  async setupAdmin(@Body() userCreateDto: CreateAdminDto, @Res({ passthrough: true }) response: Response) {
    return await this.authService.setupAdmin(response, userCreateDto);
  }

  @UseGuards(FirstUserSignupDisableGuard)
  @Post('setup-account-from-token')
  async create(@Body() userCreateDto: CreateUserDto, @Res({ passthrough: true }) response: Response) {
    return await this.authService.setupAccountFromInvitationToken(response, userCreateDto);
  }

  @UseGuards(FirstUserSignupDisableGuard)
  @Post('accept-invite')
  async acceptInvite(@Body() acceptInviteDto: AcceptInviteDto) {
    return await this.authService.acceptOrganizationInvite(acceptInviteDto);
  }

  @UseGuards(SignupDisableGuard)
  @UseGuards(FirstUserSignupDisableGuard)
  @Post('signup')
  async signup(@Body() appAuthDto: AppSignupDto) {
    return this.authService.signup(appAuthDto.email, appAuthDto.name, appAuthDto.password);
  }

  @UseGuards(SignupDisableGuard)
  @UseGuards(FirstUserSignupDisableGuard)
  @Post('resend-invite')
  async resendInvite(@Body('email') email: string) {
    return this.authService.resendEmail(email);
  }

  @UseGuards(FirstUserSignupDisableGuard)
  @Get('verify-invite-token')
  async verifyInviteToken(@Query('token') token, @Query('organizationToken') organizationToken) {
    return await this.authService.verifyInviteToken(token, organizationToken);
  }

  @UseGuards(FirstUserSignupDisableGuard)
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
