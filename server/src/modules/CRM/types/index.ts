export interface CRMData {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isTrialOpted?: boolean;
  isCloudTrialOpted?: boolean;
  paymentTry?: boolean;
  isInvited?: boolean;
  isSignedUpUsingGoogleSSO?: boolean;
  isSignedUpUsingGithubSSO?: boolean;
  utmParams?: Record<string, any>;
}
