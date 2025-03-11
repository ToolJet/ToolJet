import { Injectable } from '@nestjs/common';
import { IOidcService } from '../interfaces/IOidcService';
import { Response } from 'express';
import UserResponse from '../models/user_response';

@Injectable()
export class OidcOAuthService implements IOidcService {
  async signIn(code: string, configs: any): Promise<UserResponse> {
    throw new Error('Method not implemented');
  }

  async getConfigs(
    configId: string,
    codeChallenge?: string
  ): Promise<{ codeVerifier: string; authorizationUrl: string }> {
    throw new Error('Method not implemented');
  }

  async handleOIDCConfigs(response: Response, configId: string): Promise<{ authorizationUrl: string }> {
    throw new Error('Method not implemented');
  }
}
