import { UserinfoResponse } from 'openid-client';

export default interface UserResponse {
  userSSOId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  sso: string;
  groups?: string[];
  profilePhoto?: any;
  userinfoResponse?: UserinfoResponse;
}
