import UserResponse from '../models/user_response';

export interface ILdapService {
  signIn(body: { username: string; password: string }, ssoConfigs: any): Promise<UserResponse>;
  initializeLdapClient(configs: any): Promise<any>;
  unbindLdapClient(client: any): Promise<void>;
  search(dn: string, options: any, client: any, callback: any): Promise<void>;
}
