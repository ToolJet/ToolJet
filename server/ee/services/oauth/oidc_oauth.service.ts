import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { BaseClient, CallbackParamsType, Issuer, TokenSet } from 'openid-client';
import UserResponse from './models/user_response';

@Injectable()
export class OidcOAuthService {
  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('SSO_OIDC_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SSO_OIDC_CLIENT_SECRET');
    this.wellKnownUrl = this.configService.get<string>('SSO_OIDC_WELL_KNOWN_URL');
    this.tooljetHost = this.configService.get<string>('TOOLJET_HOST');

    this.redirectUri = this.tooljetHost + "/sso/oidc";

    Issuer.discover(this.wellKnownUrl).then(issuer => {
      this.oidcClient = new issuer.Client({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uris: [this.redirectUri]
      });
    });
  }
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly wellKnownUrl: string;
  private readonly tooljetHost: string;
  private oidcClient: BaseClient;
  private readonly redirectUri: string;

  getAuthorizationUrl(code_challenge: string) {
    return this.oidcClient.authorizationUrl({
      scope: 'openid email profile',
      resource: this.tooljetHost,
      code_challenge,
      code_challenge_method: 'S256',
    });
  }


  async #getUserDetails(client: BaseClient, { access_token }: TokenSet): Promise<UserResponse> {
    const response: any = await client.userinfo(access_token);
    const { name, email } = response;

    const words = name?.split(' ');
    const firstName = words?.[0] || '';
    const lastName = words?.length > 1 ? words[words.length - 1] : '';

    return { userSSOId: access_token, firstName, lastName, email, sso: this.clientId };
  }

  async signIn(req: Request, code: string): Promise<any> {
    const code_verifier = req.cookies['code_verifier'];
    const params: CallbackParamsType = {
      code: code,
    }
    const tokenSet = await this.oidcClient.callback(this.redirectUri, params, { code_verifier });
    return await this.#getUserDetails(this.oidcClient, tokenSet);
  }
}
