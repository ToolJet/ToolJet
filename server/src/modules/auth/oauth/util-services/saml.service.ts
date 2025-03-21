import { Injectable } from '@nestjs/common';
import { ISamlService } from '../interfaces/ISamlService';
import UserResponse from '../models/user_response';

@Injectable()
export class SamlService implements ISamlService {
  async signIn(samlResponseId: string, configs: any, configId: string): Promise<UserResponse> {
    throw new Error('Method not implemented');
  }

  async getSAMLAuthorizationURL(configId: string): Promise<string> {
    throw new Error('Method not implemented');
  }

  async getSAMLAssert(SAMLResponse: string): Promise<any> {
    throw new Error('Method not implemented');
  }

  async saveSAMLResponse(configId: string, response: string): Promise<string> {
    throw new Error('Method not implemented');
  }
}
