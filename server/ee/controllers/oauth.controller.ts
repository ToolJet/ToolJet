import { Body, Controller, Param, Post, Get, UseGuards, Req, Res } from '@nestjs/common';
import { OauthService } from '../services/oauth/oauth.service';
import { OidcOAuthService } from '../services/oauth/oidc_auth.service';
import { CookieOptions, Response, Request } from 'express';
import { OrganizationAuthGuard } from 'src/modules/auth/organization-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { ConfigService } from '@nestjs/config';
import { SAMLService } from '@ee/services/oauth/saml.service';
import { OIDCGuard } from '@ee/licensing/guards/oidc.guard';

@Controller(['oauth', 'sso'])
export class OauthController {
  constructor(
    private oauthService: OauthService,
    private oidcOAuthService: OidcOAuthService,
    private samlService: SAMLService,
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

  @Get(['saml/configs/:configId'])
  async getSAMLRedirect(@Param('configId') configId) {
    const authorizationUrl = await this.samlService.getSAMLAuthorizationURL(configId);
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

  @Post('/saml/:configId')
  async samlResponse(@Req() req: Request, @Param('configId') configId, @Res() res: Response) {
    const responseId = await this.samlService.saveSAMLResponse(configId, req.body?.SAMLResponse);
    return res.redirect(
      `${process.env.TOOLJET_HOST}${process.env.SUB_PATH || '/'}sso/saml/${configId}?saml_response_id=${responseId}`
    );
  }
}
