import { Injectable } from '@nestjs/common';
import { ILdapService } from '../interfaces/ILdapService';
import UserResponse from '../models/user_response';
import { SearchOptions, Client } from 'ldapjs';

@Injectable()
export class LdapService implements ILdapService {
  async signIn(body: any, ssoConfigs: any): Promise<UserResponse> {
    throw new Error('Method not implemented');
  }

  async initializeLdapClient(configs: any): Promise<Client> {
    throw new Error('Method not implemented');
  }

  async unbindLdapClient(client: Client): Promise<void> {
    throw new Error('Method not implemented');
  }

  async search(dn: string, options: SearchOptions, client: Client, callback: any): Promise<void> {
    throw new Error('Method not implemented');
  }
}
