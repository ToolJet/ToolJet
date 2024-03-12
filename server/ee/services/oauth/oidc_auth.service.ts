import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseClient, CallbackParamsType, Issuer, TokenSet, generators, UserinfoResponse } from 'openid-client';
import UserResponse from './models/user_response';
import { OrganizationsService } from '@services/organizations.service';
import * as uuid from 'uuid';
import { InstanceSSOConfigMap } from '@services/organizations.service';

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
      const configs = await this.organizationsService.getInstanceSSOConfigs();
      // Create a map from the ssoConfigs array
      const ssoConfigMap: InstanceSSOConfigMap = {};
      configs.forEach((config) => {
        ssoConfigMap[config.sso] = {
          enabled: config.enabled,
          configs: config.configs,
        };
      });
      ssoConfigs = {
        clientId: ssoConfigMap?.openid?.configs?.clientId || '',
        clientSecret: ssoConfigMap?.openid?.configs?.clientSecret || '',
        wellKnownUrl: ssoConfigMap?.openid?.configs?.wellKnownUrl || '',
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
    let email, name, id_token_decrypted;
    if (id_token) {
      try {
        id_token_decrypted = this.#parseJwt(id_token);
        email = id_token_decrypted?.email;
        name = id_token_decrypted?.name;
      } catch (error) {
        console.error('Error while parsing JWT', error);
      }
    }
    let userinfoResponse: UserinfoResponse = await this.oidcClient.userinfo(access_token);
    const emailData = email;
    ({ name, email } = userinfoResponse);
    if (!email && emailData) {
      // id_token contains email, userinfo don't
      email = emailData;
    }

    const words = name?.split(' ');
    const firstName = words?.[0] || '';
    const lastName = words?.length > 1 ? words[words.length - 1] : '';

    /* EXPOSE THE ACCESS AND ID TOKENS TO THE USER */
    userinfoResponse = {
      ...userinfoResponse,
      access_token,
      ...(id_token ? { id_token } : {}),
      ...(id_token_decrypted ? { id_token_decrypted } : {}),
    };

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
