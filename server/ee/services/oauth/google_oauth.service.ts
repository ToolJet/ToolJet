import { Injectable } from '@nestjs/common';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import UserResponse from './models/user_response';

@Injectable()
export class GoogleOAuthService {
  constructor() {}

  #extractDetailsFromPayload(payload: TokenPayload): UserResponse {
    const email = payload.email;
    const userSSOId = payload.sub;

    const words = payload.name?.split(' ');
    const firstName = words?.[0] || '';
    const lastName = words?.length > 1 ? words[words.length - 1] : '';

    return { userSSOId, firstName, lastName, email, sso: 'google' };
  }

  async signIn(token: string, configs: any): Promise<UserResponse> {
    const client: OAuth2Client = new OAuth2Client(configs.clientId);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: configs.clientId,
    });
    const payload = ticket.getPayload();
    return this.#extractDetailsFromPayload(payload);
  }
}
