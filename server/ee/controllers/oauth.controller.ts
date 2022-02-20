import { OidcOAuthService } from '@ee/services/oauth/oidc_oauth.service';
import { Body, Controller, Get, HttpStatus, Post, Request, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request as HttpReq, Response } from 'express';
import { generators } from 'openid-client';
import { OauthService } from '../services/oauth/oauth.service';

@Controller('oauth')
export class OauthController {
  constructor(private oauthService: OauthService, private oidcOauthService: OidcOAuthService, private configService: ConfigService) {
    this.tooljetHost = this.configService.get<string>('TOOLJET_HOST');
  }

  private readonly tooljetHost;

  @Post('sign-in')
  async create(@Request() req: HttpReq, @Res({ passthrough: true }) response: Response, @Body() body) {
    response.setHeader('Access-Control-Allow-Origin', this.tooljetHost);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    const result = await this.oauthService.signIn(req, body);
    return result;
  }

  @Get('oidc')
  async getOidcRedirect(@Res({ passthrough: true }) response: Response) {
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);

    response.cookie('code_verifier', code_verifier);
    const authorizationUrl = this.oidcOauthService.getAuthorizationUrl(code_challenge);
    response.status(HttpStatus.OK);
    response.setHeader('Access-Control-Allow-Origin', this.tooljetHost);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    return { authorizationUrl };
  }
}
