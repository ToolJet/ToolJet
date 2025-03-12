import UserResponse from '../models/user_response';

export interface IGoogleOAuthService {
  signIn(token: string, configs: any): Promise<UserResponse>;
}
