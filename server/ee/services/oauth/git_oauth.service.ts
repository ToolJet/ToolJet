import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import got from 'got';

@Injectable()
export class GitOAuthService {
  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_SECRET');
  }
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly authUrl = 'https://github.com/login/oauth/access_token';
  private readonly getUserUrl = 'https://api.github.com/user';

  async #getUserDetails({ access_token }: AuthResponse): Promise<UserResponse> {
    const response = await got(this.getUserUrl, {
      method: 'get',
      headers: { Accept: 'application/json', Authorization: `token ${access_token}` },
    });
    const result = JSON.parse(response.body);

    console.log('---?>>>', result);
    

    const { userSSOId, firstName, lastName, email, domain } = result;

    return { userSSOId, firstName, lastName, email, domain };
  }

  async signIn(code: string): Promise<any> {
    const response = await got(this.authUrl, {
      method: 'post',
      headers: { Accept: 'application/json' },
      json: { client_id: this.clientId, client_secret: this.clientSecret, code },
    });
    const result = JSON.parse(response.body);
    return this.#getUserDetails(result);
  }
}

interface AuthResponse {
  access_token: string;
  scope?: string;
  token_type?: string;
}

interface UserResponse {
  userSSOId: string;
  firstName: string;
  lastName?: string;
  email: string;
  domain?: string;
}
