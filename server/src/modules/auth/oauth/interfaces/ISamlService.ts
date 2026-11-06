import { SAML } from '@node-saml/node-saml';
import UserResponse from '../models/user_response';

export interface ISamlService {
  signIn(
    samlResponseId: string,
    configs: any,
    extraProps: { configId: string; orgSlug: string; host?: string }
  ): Promise<UserResponse>;
  getSAMLAuthorizationURL(configId: string, host?: string): Promise<string>;
  getSAMLAssert(SAMLResponse: string, saml: SAML): Promise<any>;
  saveSAMLResponse(configId: string, response: string): Promise<string>;
}
