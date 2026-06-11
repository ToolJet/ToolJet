import { Response } from 'express';
import UserResponse from '../models/user_response';

export interface IOidcService {
  signIn(code: string, configs: any): Promise<UserResponse>;
  getConfigs(configId: string): Promise<{
    codeVerifier: string;
    authorizationUrl: string;
  }>;
  handleOIDCConfigs(response: Response, configId: string): Promise<{ authorizationUrl: string }>;
}
