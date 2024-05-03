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
  UnauthorizedException,
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
import { CreateAdminDto, CreateUserDto, TrialUserDto } from '@dto/user.dto';
import { AcceptInviteDto } from '@dto/accept-organization-invite.dto';
import { UserCountGuard } from '@ee/licensing/guards/user.guard';
import { EditorUserCountGuard } from '@ee/licensing/guards/editorUser.guard';
import { AllowPersonalWorkspaceGuard } from 'src/modules/instance_settings/personal-workspace.guard';
import { FirstUserSignupDisableGuard } from 'src/modules/auth/first-user-signup-disable.guard';
import { FirstUserSignupGuard } from 'src/modules/auth/first-user-signup.guard';
import { OrganizationAuthGuard } from 'src/modules/auth/organization-auth.guard';
import { AuthorizeWorkspaceGuard } from 'src/modules/auth/authorize-workspace-guard';
import { Response } from 'express';
import { SessionAuthGuard } from 'src/modules/auth/session-auth-guard';
import { UsersService } from '@services/users.service';
import { SessionService } from '@services/session.service';
import { SuperAdminGuard } from 'src/modules/auth/super-admin.guard';
import { OrganizationsService } from '@services/organizations.service';
import { Organization } from 'src/entities/organization.entity';
import { SwitchWorkspaceAuthGuard } from 'src/modules/auth/switch-workspace.guard';
import { isSuperAdmin } from 'src/helpers/utils.helper';
import { InvitedUserSessionAuthGuard } from 'src/modules/auth/invited-user-session.guard';
import { InvitedUser } from 'src/decorators/invited-user.decorator';
import { InvitedUserSessionDto } from '@dto/invited-user-session.dto';
import { ActivateAccountWithTokenDto } from '@dto/activate-account-with-token.dto';
import { OrganizationInviteAuthGuard } from 'src/modules/auth/organization-invite-auth.guard';

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
    return this.authService.login(response, appAuthDto);
  }

  @Post('authenticate/super-admin')
  async superAdminLogin(@Body() appAuthDto: AppAuthenticationDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.userService.findByEmail(appAuthDto.email);
    if (!isSuperAdmin(user)) {
      throw new UnauthorizedException('Only superadmin can login through this url');
    }
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

  @UseGuards(SignupDisableGuard)
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
    let currentOrganization: Organization;
    let appData: any;
    if (appId) {
      appData = await this.userService.retrieveAppDataUsingSlug(appId);
    }

    /* if the user has a session and the app is public, we don't need to authorize the app organization id */
    if ((appData && !appData?.isPublic) || workspaceSlug) {
      const organization = await this.organizationService.fetchOrganization(workspaceSlug || appData.organizationId);
      if (!organization) {
        throw new NotFoundException("Coudn't found workspace. workspace id or slug is incorrect!.");
      }
      currentOrganization = organization;
    }

    if (appData && appData?.isPublic) {
      await this.organizationService.fetchOrganization(appData.organizationId);
    }

    return this.authService.generateSessionPayload(user, currentOrganization, appData);
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

  @UseGuards(SwitchWorkspaceAuthGuard)
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

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post('activate-trial')
  async activateTrial() {
    const { companyName, companySize, role, email, phoneNumber, firstName, lastName } =
      await this.userService.findSelfhostOnboardingDetails();
    const userDto: TrialUserDto = {
      companyName,
      companySize,
      role,
      email,
      phoneNumber,
      name: `${firstName} ${lastName}`,
      requestedTrial: true,
    };
    return await this.authService.activateTrial(userDto);
  }

  @UseGuards(FirstUserSignupDisableGuard)
  @Post('setup-account-from-token')
  async create(@Body() userCreateDto: CreateUserDto, @Res({ passthrough: true }) response: Response) {
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

  @UseGuards(
    SignupDisableGuard,
    UserCountGuard,
    EditorUserCountGuard,
    AllowPersonalWorkspaceGuard,
    FirstUserSignupDisableGuard
  )
  @Post('signup')
  async signup(@Body() appSignUpDto: AppSignupDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.signup(appSignUpDto, response);
  }

  @UseGuards(SignupDisableGuard, FirstUserSignupDisableGuard)
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
