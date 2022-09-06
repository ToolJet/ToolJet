import { Body, Controller, Param, Post, Get, UseGuards, Req, Res } from '@nestjs/common';
import { OauthService } from '../services/oauth/oauth.service';
import { OidcOAuthService } from '../services/oauth/oidc_auth.service';
import { MultiOrganizationGuard } from 'src/modules/auth/multi-organization.guard';
import { Response, Request } from 'express';

@Controller('oauth')
export class OauthController {
  constructor(private oauthService: OauthService, private oidcOAuthService: OidcOAuthService) {}

  @Post('sign-in/:configId')
  async create(@Req() req: Request, @Param('configId') configId, @Body() body) {
    const result = await this.oauthService.signIn(body, configId, null, req.cookies);
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

  @UseGuards(MultiOrganizationGuard)
  @Post('sign-in/common/:ssoType')
  async commonSignIn(@Req() req: Request, @Param('ssoType') ssoType, @Body() body) {
    const result = await this.oauthService.signIn(body, null, ssoType, req.cookies);
    return result;
  }
}
