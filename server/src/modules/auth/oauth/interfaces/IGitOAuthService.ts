import UserResponse from '../models/user_response';

export interface IGitOAuthService {
  signIn(code: string, configs: any): Promise<UserResponse>;
}
