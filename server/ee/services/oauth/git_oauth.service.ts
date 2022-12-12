import { Injectable } from '@nestjs/common';
import got from 'got';
import UserResponse from './models/user_response';

@Injectable()
export class GitOAuthService {
  private readonly authUrl = '/login/oauth/access_token';

  #getAuthUrl(hostName) {
    return `${hostName || 'https://github.com'}${this.authUrl}`;
  }
  #getUserUrl(hostName) {
    return `${hostName ? `${hostName}/api/v3` : 'https://api.github.com'}/user`;
  }
  #getUserEmailUrl(hostName) {
    return `${hostName ? `${hostName}/api/v3` : 'https://api.github.com'}/user/emails`;
  }
  async #getUserDetails({ access_token }: AuthResponse, hostName: string): Promise<UserResponse> {
    const response: any = await got(this.#getUserUrl(hostName), {
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
      email = await this.#getEmailId(access_token, hostName);
    }

    return { userSSOId: access_token, firstName, lastName, email, sso: 'git' };
  }

  async #getEmailId(access_token: string, hostName: string) {
    const response: any = await got(this.#getUserEmailUrl(hostName), {
      method: 'get',
      headers: { Accept: 'application/json', Authorization: `token ${access_token}` },
    }).json();

    return response?.find((emails) => emails.primary)?.email;
  }

  async signIn(code: string, configs: any): Promise<any> {
    const response: any = await got(this.#getAuthUrl(configs.hostName), {
      method: 'post',
      headers: { Accept: 'application/json' },
      json: { client_id: configs.clientId, client_secret: configs.clientSecret, code },
    }).json();

    return await this.#getUserDetails(response, configs.hostName);
  }
}

interface AuthResponse {
  access_token: string;
  scope?: string;
  token_type?: string;
}
