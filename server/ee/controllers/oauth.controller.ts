import { Body, Controller, Param, Post, Get, Res, Req } from '@nestjs/common';
import { OauthService } from '../services/oauth/oauth.service';
import { OidcOAuthService } from '../services/oauth/oidc_auth.service';
import { Response, Request } from 'express';

@Controller('oauth')
export class OauthController {
  constructor(private oauthService: OauthService, private oidcOAuthService: OidcOAuthService) {}

  @Post('sign-in/:configId')
  async create(@Req() req: Request, @Param('configId') configId, @Body() body) {
    const result = await this.oauthService.signIn(body, configId, req.cookies);
    return result;
  }

  @Get('openid/configs/:configId')
  async getOpenIDRedirect(@Res({ passthrough: true }) response: Response, @Param('configId') configId) {
    const { codeVerifier, authorizationUrl } = await this.oidcOAuthService.getConfigs(configId);
    response.cookie('oidc_code_verifier', codeVerifier, {
      httpOnly: true,
      expires: new Date(new Date().getTime() + 60 * 5 * 1000), // cookie expiry 5 minutes
      sameSite: 'strict',
    });
    return { authorizationUrl };
  }
}
