import { Body, Controller, Param, Post, Get, UseGuards, Req, Res } from '@nestjs/common';
import { OauthService } from '../services/oauth/oauth.service';
import { OidcOAuthService } from '../services/oauth/oidc_auth.service';
import { CookieOptions, Response } from 'express';
import { OrganizationAuthGuard } from 'src/modules/auth/organization-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { ConfigService } from '@nestjs/config';
import { LdapService } from '@ee/services/oauth/ldap.service';
import { OIDCGuard } from '@ee/licensing/guards/oidc.guard';

@Controller('oauth')
export class OauthController {
  constructor(
    private oauthService: OauthService,
    private oidcOAuthService: OidcOAuthService,
    private ldapService: LdapService,
    private configService: ConfigService
  ) {}

  @UseGuards(OrganizationAuthGuard)
  @Post('sign-in/:configId')
  async signIn(
    @Req() req,
    @Param('configId') configId,
    @Body() body,
    @User() user,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.oauthService.signIn(response, body, configId, null, user, req.cookies);
    return result;
  }

  @UseGuards(OIDCGuard)
  @Get(['openid/configs/:configId', 'openid/configs'])
  async getOpenIDRedirect(@Res({ passthrough: true }) response: Response, @Param('configId') configId) {
    const { codeVerifier, authorizationUrl } = await this.oidcOAuthService.getConfigs(configId);

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      sameSite: 'strict',
    };

    if (this.configService.get<string>('ENABLE_PRIVATE_APP_EMBED') === 'true') {
      // disable cookie security
      cookieOptions.sameSite = 'none';
      cookieOptions.secure = true;
    }

    response.cookie('oidc_code_verifier', codeVerifier, cookieOptions);
    return { authorizationUrl };
  }

  @UseGuards(OrganizationAuthGuard)
  @Post('sign-in/common/:ssoType')
  async commonSignIn(
    @Req() req,
    @Param('ssoType') ssoType,
    @Body() body,
    @User() user,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.oauthService.signIn(response, body, null, ssoType, user, req.cookies);
    return result;
  }
}
