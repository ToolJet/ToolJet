import { Injectable } from '@nestjs/common';
import got from 'got';
import UserResponse from '../models/user_response';
import { AuthResponse } from '../interfaces/IAuthResponse';
import { IGitOAuthService } from '../interfaces/IGitOAuthService';

@Injectable()
export class GitOAuthService implements IGitOAuthService {
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

    // GitHub only allows a verified address to be set as the public profile email, so a
    // present `email` here is verified; the /user/emails fallback carries its own `verified` flag.
    let emailVerified = !!email;
    if (!email) {
      // email visibility not set to public
      const primaryEmail = await this.#getPrimaryEmail(access_token, hostName);
      email = primaryEmail?.email;
      emailVerified = !!primaryEmail?.verified;
    }

    const userinfoResponse = {
      ...response,
      access_token,
    };

    return { userSSOId: access_token, firstName, lastName, email, emailVerified, sso: 'git', userinfoResponse };
  }

  async #getPrimaryEmail(access_token: string, hostName: string): Promise<{ email: string; verified: boolean }> {
    const response: any = await got(this.#getUserEmailUrl(hostName), {
      method: 'get',
      headers: { Accept: 'application/json', Authorization: `token ${access_token}` },
    }).json();

    return response?.find((emails) => emails.primary);
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
