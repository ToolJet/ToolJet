import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseClient, CallbackParamsType, Issuer, TokenSet, generators } from 'openid-client';
import UserResponse from './models/user_response';
import { OrganizationsService } from '@services/organizations.service';
import * as uuid from 'uuid';

@Injectable()
export class OidcOAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly organizationsService: OrganizationsService
  ) {
    this.tooljetHost = this.configService.get<string>('TOOLJET_HOST');
  }
  private readonly tooljetHost: string;
  private oidcClient: BaseClient;
  private readonly redirectUri: string;

  async #setClient(configs: any, configId: string) {
    let ssoConfigs: any;
    if (!configs) {
      ssoConfigs = (await this.organizationsService.getConfigs(configId))?.configs;
    } else {
      ssoConfigs = configs;
    }

    const issuer = await Issuer.discover(ssoConfigs.wellKnownUrl);

    this.oidcClient = new issuer.Client({
      client_id: ssoConfigs.clientId,
      client_secret: ssoConfigs.clientSecret,
      redirect_uris: [`${this.tooljetHost}/sso/openid/${configId}`],
    });
  }

  async getConfigs(configId: string) {
    await this.#setClient(null, configId);
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    const authorizationUrl = this.oidcClient.authorizationUrl({
      scope: 'openid email profile',
      resource: this.tooljetHost,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: uuid.v4(),
    });

    return {
      codeVerifier,
      authorizationUrl,
    };
  }

  async #getUserDetails({ access_token }: TokenSet): Promise<UserResponse> {
    const response: any = await this.oidcClient.userinfo(access_token);
    const { name, email } = response;

    const words = name?.split(' ');
    const firstName = words?.[0] || '';
    const lastName = words?.length > 1 ? words[words.length - 1] : '';

    return { userSSOId: access_token, firstName, lastName, email, sso: 'openid' };
  }

  async signIn(code: string, configs: any): Promise<any> {
    await this.#setClient(configs, configs.configId);
    const params: CallbackParamsType = {
      code,
    };
    const tokenSet: TokenSet = await this.oidcClient.callback(
      `${this.tooljetHost}/sso/openid/${configs.configId}`,
      params,
      {
        code_verifier: configs.codeVerifier,
      }
    );
    return await this.#getUserDetails(tokenSet);
  }
}
