import UserResponse from '../models/user_response';

export interface ISamlService {
  signIn(samlResponseId: string, configs: any, configId: string): Promise<UserResponse>;
  getSAMLAuthorizationURL(configId: string): Promise<string>;
  getSAMLAssert(SAMLResponse: string): Promise<any>;
  saveSAMLResponse(configId: string, response: string): Promise<string>;
}
