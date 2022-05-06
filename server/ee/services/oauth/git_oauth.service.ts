import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import got from 'got';
import UserResponse from './models/user_response';

@Injectable()
export class GitOAuthService {
  constructor(private readonly configService: ConfigService) {}
  private readonly authUrl = 'https://github.com/login/oauth/access_token';
  private readonly getUserUrl = 'https://api.github.com/user';
  private readonly getUserEmailUrl = 'https://api.github.com/user/emails';

  async #getUserDetails({ access_token }: AuthResponse): Promise<UserResponse> {
    const response: any = await got(this.getUserUrl, {
      method: 'get',
      headers: { Accept: 'application/json', Authorization: `token ${access_token}` },
    }).json();

    const { name } = response;
    let { email } = response;
    const words = name?.split(' ');
    const firstName = words?.[0] || '';
    const lastName = words?.length > 1 ? words[words.length - 1] : '';

    if (!email) {
      // email visibility not set to public
      email = await this.#getEmailId(access_token);
    }

    return { userSSOId: access_token, firstName, lastName, email, sso: 'git' };
  }

  async #getEmailId(access_token: string) {
    const response: any = await got(this.getUserEmailUrl, {
      method: 'get',
      headers: { Accept: 'application/json', Authorization: `token ${access_token}` },
    }).json();

    return response?.find((emails) => emails.primary)?.email;
  }

  async signIn(code: string, configs: any): Promise<any> {
    const response: any = await got(this.authUrl, {
      method: 'post',
      headers: { Accept: 'application/json' },
      json: { client_id: configs.clientId, client_secret: configs.clientSecret, code },
    }).json();

    return await this.#getUserDetails(response);
  }
}

interface AuthResponse {
  access_token: string;
  scope?: string;
  token_type?: string;
}
