import { Body, Controller, Param, Post, Get, UseGuards, Req, Res } from '@nestjs/common';
import { OauthService } from '../services/oauth/oauth.service';
import { OidcOAuthService } from '../services/oauth/oidc_auth.service';
import { Response, Request } from 'express';
import { OrganizationAuthGuard } from 'src/modules/auth/organization-auth.guard';
import { User } from 'src/decorators/user.decorator';

@Controller('oauth')
export class OauthController {
  constructor(private oauthService: OauthService, private oidcOAuthService: OidcOAuthService) {}

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

  @Get(['openid/configs/:configId', 'openid/configs'])
  async getOpenIDRedirect(@Res({ passthrough: true }) response: Response, @Param('configId') configId) {
    const { codeVerifier, authorizationUrl } = await this.oidcOAuthService.getConfigs(configId);
    response.cookie('oidc_code_verifier', codeVerifier, {
      httpOnly: true,
      sameSite: 'strict',
    });
    return { authorizationUrl };
  }

  @UseGuards(OrganizationAuthGuard)
  @Post('sign-in/common/:ssoType')
  async commonSignIn(
    @Param('ssoType') ssoType,
    @Body() body,
    @User() user,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.oauthService.signIn(response, body, null, ssoType, user);
    return result;
  }
}
