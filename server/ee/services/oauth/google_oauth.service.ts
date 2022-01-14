import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
@Injectable()
export class GoogleOAuthService {
  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID');
    this.client = new OAuth2Client(this.clientId);
  }
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  #extractDetailsFromPayload(payload: TokenPayload): any {
    const email = payload.email;
    const userSSOId = payload.sub;
    const domain = payload.hd;

    const words = payload.name?.split(' ');
    const firstName = words?.[0] || '';
    const lastName = words?.length > 1 ? words[words.length - 1] : '';
    return { userSSOId, firstName, lastName, email, domain };
  }

  async signIn(token: string): Promise<any> {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: this.clientId,
    });
    const payload = ticket.getPayload();
    return this.#extractDetailsFromPayload(payload);
  }
}
