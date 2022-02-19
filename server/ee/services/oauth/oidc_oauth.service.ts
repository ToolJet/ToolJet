import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Strategy, Client, UserinfoResponse, TokenSet, Issuer, custom, BaseClient } from 'openid-client';
import UserResponse from './models/user_response';

export const buildOpenIdClient = async () => {
  const TrustIssuer = await Issuer.discover(`https://${process.env.AUTH_ONELOGIN_SUBDOMAIN}.onelogin.com/oidc/.well-known/openid-configuration`);
  const client = new TrustIssuer.Client({
    client_id: process.env.AUTH_ONELOGIN_CLIENT_ID,
    client_secret: process.env.AUTH_ONELOGIN_CLIENT_SECRET,
    token_endpoint_auth_method: 'client_secret_post',
  });
  return client;
};

@Injectable()
export class OidcOAuthService {
  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('SSO_OIDC_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SSO_OIDC_CLIENT_SECRET');
    this.wellKnownUrl = this.configService.get<string>('SSO_OIDC_WELL_KNOWN_URL');
  }
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly wellKnownUrl: string;
  private readonly getUserUrl = 'https://api.github.com/user';

  async #buildOpenIdClient() {
    const TrustIssuer = await Issuer.discover(this.wellKnownUrl);
    const client = new TrustIssuer.Client({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      token_endpoint_auth_method: 'client_secret_post',
    });
    return client;
  };

  async #getUserDetails(client: BaseClient, { access_token }: TokenSet): Promise<UserResponse> {
    const response: any = await client.userinfo(access_token);
    const { name, email } = response;

    const words = name?.split(' ');
    const firstName = words?.[0] || '';
    const lastName = words?.length > 1 ? words[words.length - 1] : '';

    return { userSSOId: access_token, firstName, lastName, email, sso: this.clientId };
  }

  async signIn(code: string): Promise<any> {
    const client = await this.#buildOpenIdClient();
    const tokenSet = await client.callback("http://localhost:8000/callback", {
      id_token: code
    });
    return await this.#getUserDetails(client, tokenSet);
  }
}

interface AuthResponse {
  access_token: string;
  scope?: string;
  token_type?: string;
}
