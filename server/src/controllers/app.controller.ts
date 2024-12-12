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
import { CreateAdminDto, OnboardUserDto } from '@dto/user.dto';
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
import { Organization } from 'src/entities/organization.entity';
import { InvitedUserSessionAuthGuard } from 'src/modules/auth/invited-user-session.guard';
import { InvitedUser } from 'src/decorators/invited-user.decorator';
import { InvitedUserSessionDto } from '@dto/invited-user-session.dto';
import { ActivateAccountWithTokenDto } from '@dto/activate-account-with-token.dto';
import { OrganizationInviteAuthGuard } from 'src/modules/auth/organization-invite-auth.guard';
import { ResendInviteDto } from '@dto/resend-invite.dto';
import { OrganizationUsersService } from '@services/organization_users.service';

@Controller()
export class AppController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
    private sessionService: SessionService,
    private organizationService: OrganizationsService,
    private organizationUsersService: OrganizationUsersService
  ) {}

  @Post('authenticate')
  async login(@Body() appAuthDto: AppAuthenticationDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(response, appAuthDto);
  }

  @UseGuards(OrganizationAuthGuard)
  @Post('authenticate/:organizationId')
  async organizationLogin(
    @User() user,
    @Body() appAuthDto: AppAuthenticationDto,
    @Param('organizationId') organizationId,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.authService.login(response, appAuthDto, organizationId, user);
  }

  @UseGuards(InvitedUserSessionAuthGuard)
  @Post('invited-user-session')
  async getInvitedUserSessionDetails(@User() user, @InvitedUser() invitedUser, @Body() tokens: InvitedUserSessionDto) {
    return await this.authService.validateInvitedUserSession(user, invitedUser, tokens);
  }

  @UseGuards(FirstUserSignupDisableGuard)
  @Post('activate-account-with-token')
  async activateAccountWithToken(
    @Body() activateAccountWithPasswordDto: ActivateAccountWithTokenDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.authService.activateAccountWithToken(activateAccountWithPasswordDto, response);
  }

  @UseGuards(SessionAuthGuard)
  @Get('session')
  async getSessionDetails(@User() user, @Query('appId') appId: string, @Query('workspaceSlug') workspaceSlug: string) {
    let appData: { organizationId: string; isPublic: boolean };
    let currentOrganization: Organization;
    if (appId) {
      appData = await this.userService.returnOrgIdOfAnApp(appId);
    }

    if (workspaceSlug || appData?.organizationId) {
      const organization = await this.organizationService.fetchOrganization(workspaceSlug || appData.organizationId);
      if (!organization) {
        throw new NotFoundException("Coudn't found workspace. workspace id or slug is incorrect!.");
      }
      const activeMemberOfOrganization = await this.organizationUsersService.isTheUserIsAnActiveMemberOfTheWorkspace(
        user.id,
        organization.id
      );
      if (!appData?.isPublic || activeMemberOfOrganization) currentOrganization = organization;
      const alreadyWorkspaceSessionAvailable = user.organizationIds?.includes(appData?.organizationId);
      const orgIdNeedsToBeUpdatedForApplicationSession =
        appData && appData.organizationId !== user.defaultOrganizationId && alreadyWorkspaceSessionAvailable;
      if (orgIdNeedsToBeUpdatedForApplicationSession) {
        /* If the app's organization id is there in the JWT and user default organization id is different, then update it */
        await this.userService.updateUser(user.id, { defaultOrganizationId: appData.organizationId });
      }
    }
    return await this.authService.generateSessionPayload(user, currentOrganization);
  }

  @UseGuards(SessionAuthGuard)
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
  async create(@Body() userCreateDto: OnboardUserDto, @Res({ passthrough: true }) response: Response) {
    return await this.authService.setupAccountFromInvitationToken(response, userCreateDto);
  }

  @UseGuards(FirstUserSignupDisableGuard)
  @UseGuards(OrganizationInviteAuthGuard)
  @Post('accept-invite')
  async acceptInvite(
    @User() user,
    @Body() acceptInviteDto: AcceptInviteDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return await this.authService.acceptOrganizationInvite(response, user, acceptInviteDto);
  }

  @UseGuards(FirstUserSignupDisableGuard)
  @Post('signup')
  async signup(@Body() appSignUpDto: AppSignupDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.signup(appSignUpDto, response);
  }

  @UseGuards(SignupDisableGuard)
  @UseGuards(FirstUserSignupDisableGuard)
  @Post('resend-invite')
  async resendInvite(@Body() body: ResendInviteDto) {
    return this.authService.resendEmail(body);
  }

  @UseGuards(FirstUserSignupDisableGuard)
  @Get('verify-invite-token')
  async verifyInviteToken(@Query('token') token, @Query('organizationToken') organizationToken) {
    return await this.authService.verifyInviteToken(token, organizationToken);
  }

  @Get('invitee-details')
  async getInviteeDetails(@Query('token') token) {
    return await this.authService.getInviteeDetails(token);
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
