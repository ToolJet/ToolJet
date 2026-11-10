import { UserinfoResponse } from 'openid-client';

export default interface UserResponse {
  userSSOId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  emailVerified?: boolean;
  sso: string;
  groups?: string[];
  profilePhoto?: any;
  enableGroupSync?: boolean;
  userinfoResponse?: UserinfoResponse;
  instanceLevelGroupSyncs?: any[];
}
