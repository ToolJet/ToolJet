export enum FEATURE_KEY {
  // Authentication
  LOGIN = 'login', // POST 'authenticate'
  SUPER_ADMIN_LOGIN = 'superAdminLogin', // POST 'authenticate/super-admin'
  ORGANIZATION_LOGIN = 'organizationLogin', // POST 'authenticate/:organizationId'

  // Account Activation and Authorization
  AUTHORIZE = 'authorize', // GET 'authorize'
  SWITCH_WORKSPACE = 'switchWorkspace', // GET 'switch/:organizationId'

  // Setup and Signup
  SETUP_ADMIN = 'setupAdmin', // POST 'setup-admin'
  SIGNUP = 'signup', // POST 'signup'
  ACCEPT_INVITE = 'acceptInvite', // POST 'accept-invite'
  RESEND_INVITE = 'resendInvite', // POST 'resend-invite'
  VERIFY_INVITE_TOKEN = 'verifyInviteToken', // GET 'verify-invite-token'
  VERIFY_ORGANIZATION_TOKEN = 'verifyOrganizationToken', // GET 'verify-organization-token'
  SETUP_ACCOUNT_FROM_TOKEN = 'setupAccountFromToken', // POST 'setup-account-from-token'

  // Trial and Onboarding
  REQUEST_TRIAL = 'requestTrial', // GET 'request-trial'
  ACTIVATE_TRIAL = 'activateTrial', // POST 'activate-trial'
  GET_ONBOARDING_SESSION = 'getOnboardingSession', // GET 'onboarding-session'
  GET_SIGNUP_ONBOARDING_SESSION = 'getSignupOnboardingSession', // GET 'signup-onboarding-session'
  FINISH_ONBOARDING = 'finishOnboarding', // POST 'finish-onboarding'
  TRIAL_DECLINED = 'trialDeclined', // GET 'trial-declined'

  // Password Management
  FORGOT_PASSWORD = 'forgotPassword', // POST 'forgot-password'
  RESET_PASSWORD = 'resetPassword', // POST 'reset-password'

  // Invitee Details
  GET_INVITEE_DETAILS = 'getInviteeDetails', // GET 'invitee-details'

  // Oauth
  OAUTH_SIGN_IN = '/oauth/sign-in/:configId',
  OAUTH_OPENID_CONFIGS = '/oauth/configs/:configId',
  OAUTH_SAML_CONFIGS = '/oauth/saml/configs/:configId',
  OAUTH_COMMON_SIGN_IN = '/oauth/sign-in/common/:ssoType',
  OAUTH_SAML_RESPONSE = '/oauth/saml/:configId',
}
