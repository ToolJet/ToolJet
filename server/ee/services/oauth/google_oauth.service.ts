import { Injectable } from '@nestjs/common';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

@Injectable()
export class GoogleOAuthService {
  client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(process.env.SSO_GOOGLE_OAUTH2_CLIENT_ID);
  }

  #extractDetailsFromPayload(payload: TokenPayload): any {
    const email = payload.email;
    const userSSOId = payload.sub;
    const domain = payload.hd;

    const words = payload.name?.split(' ');
    const firstName = words ? words[0] : '';
    const lastName = (words && (words.length > 1)) ? words[words.length - 1] : '';
    return { userSSOId, firstName, lastName, email, domain };
  }

  async signIn(token: string): Promise<any> {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: process.env.SSO_GOOGLE_OAUTH2_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return this.#extractDetailsFromPayload(payload);
  }
}
