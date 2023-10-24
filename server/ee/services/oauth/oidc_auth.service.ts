import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseClient, CallbackParamsType, Issuer, TokenSet, generators, UserinfoResponse } from 'openid-client';
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
    this.supath = this.configService.get<string>('SUB_PATH');
  }
  private readonly tooljetHost: string;
  private readonly supath: string;
  private oidcClient: BaseClient;

  #getRedirectURL = (configId: string) =>
    `${this.tooljetHost}${this.supath || '/'}sso/openid${configId ? `/${configId}` : ''}`;

  async #setClient(configs: any, configId: string) {
    let ssoConfigs: any;

    if (configId) {
      if (!configs) {
        ssoConfigs = (await this.organizationsService.getConfigs(configId))?.configs;
      } else {
        ssoConfigs = configs;
      }
    } else {
      ssoConfigs = {
        clientId: this.configService.get<string>('SSO_OPENID_CLIENT_ID'),
        clientSecret: this.configService.get<string>('SSO_OPENID_CLIENT_SECRET'),
        wellKnownUrl: this.configService.get<string>('SSO_OPENID_WELL_KNOWN_URL'),
      };
    }

    const issuer = await Issuer.discover(ssoConfigs.wellKnownUrl);

    this.oidcClient = new issuer.Client({
      client_id: ssoConfigs.clientId,
      client_secret: ssoConfigs.clientSecret,
      redirect_uris: [this.#getRedirectURL(configId)],
    });
  }

  async getConfigs(configId: string) {
    await this.#setClient(null, configId);
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    const authorizationUrl = this.oidcClient.authorizationUrl({
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: uuid.v4(),
      redirect_uri: this.#getRedirectURL(configId),
    });

    return {
      codeVerifier,
      authorizationUrl,
    };
  }

  async #getUserDetails({ access_token, id_token }: TokenSet): Promise<UserResponse> {
    let email, name;
    if (id_token) {
      try {
        const data = this.#parseJwt(id_token);
        email = data?.email;
        name = data?.name;
      } catch (error) {
        console.error('Error while parsing JWT', error);
      }
    }
    const userinfoResponse: UserinfoResponse = await this.oidcClient.userinfo(access_token);
    const emailData = email;
    ({ name, email } = userinfoResponse);
    if (!email && emailData) {
      // id_token contains email, userinfo don't
      email = emailData;
    }

    const words = name?.split(' ');
    const firstName = words?.[0] || '';
    const lastName = words?.length > 1 ? words[words.length - 1] : '';

    return { userSSOId: access_token, firstName, lastName, email, sso: 'openid', userinfoResponse };
  }

  async signIn(code: string, configs: any): Promise<any> {
    await this.#setClient(configs, configs.configId);
    const params: CallbackParamsType = {
      code,
    };
    const tokenSet: TokenSet = await this.oidcClient.callback(this.#getRedirectURL(configs.configId), params, {
      code_verifier: configs.codeVerifier,
    });

    return await this.#getUserDetails(tokenSet);
  }

  #parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    return JSON.parse(jsonPayload);
  }
}
