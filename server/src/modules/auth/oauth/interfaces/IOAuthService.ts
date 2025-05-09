import { Response } from 'express';
import { User } from 'src/entities/user.entity';
import { SSOType } from 'src/entities/sso_config.entity';
import { SSOResponse } from './ISSOResponse';

export interface IOAuthService {
  signIn(
    response: Response,
    ssoResponse: SSOResponse,
    configId?: string,
    ssoType?: SSOType.GOOGLE | SSOType.GIT,
    user?: User,
    cookies?: object
  ): Promise<any>;

  handleOIDCConfigs(response: Response, configId: string): Promise<any>;
  getSAMLAuthorizationURL(configId: string): Promise<any>;
  saveSAMLResponse(configId: string, response: string): Promise<any>;
}
