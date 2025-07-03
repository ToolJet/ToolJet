export enum FEATURE_KEY {
  // Account Activation and Authorization
  ACTIVATE_ACCOUNT = 'activateAccount', // POST 'activate-account-with-token'

  // Setup and Signup
  SETUP_SUPER_ADMIN = 'setupSuperAdmin', // POST 'setup-super-admin'
  SIGNUP = 'signup', // POST 'signup'
  ACCEPT_INVITE = 'acceptInvite', // POST 'accept-invite'
  RESEND_INVITE = 'resendInvite', // POST 'resend-invite'
  VERIFY_INVITE_TOKEN = 'verifyInviteToken', // GET 'verify-invite-token'
  VERIFY_ORGANIZATION_TOKEN = 'verifyOrganizationToken', // GET 'verify-organization-token'
  SETUP_ACCOUNT_FROM_TOKEN = 'setupAccountFromToken', // POST 'setup-account-from-token'
  CHECK_WORKSPACE_UNIQUENESS = 'checkWorkspaceUniqueness', // Get 'rohan'

  // Trial and Onboarding
  REQUEST_TRIAL = 'requestTrial', // GET 'request-trial'
  ACTIVATE_TRIAL = 'activateTrial', // POST 'activate-trial'
  GET_ONBOARDING_SESSION = 'getOnboardingSession', // GET 'onboarding-session'
  GET_SIGNUP_ONBOARDING_SESSION = 'getSignupOnboardingSession', // GET 'signup-onboarding-session'
  FINISH_ONBOARDING = 'finishOnboarding', // POST 'finish-onboarding'
  TRIAL_DECLINED = 'trialDeclined', // GET 'trial-declined'

  // Invitee Details
  GET_INVITEE_DETAILS = 'getInviteeDetails', // GET 'invitee-details'

  // AI Onboarding
  AI_ONBOARDING = 'aiOnboarding', // POST 'ai-onboarding'
  AI_ONBOARDING_SSO = 'aiOnboardingSSO', // POST 'sign-in/common/:ssoType
  AI_COOKIE_SET = 'aiCookieSet', // POST 'set-ai-cookie'
  AI_COOKIE_DELETE = 'aiCookieDelete', // GET 'delete-ai-cookies'
}

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  ACCOUNT_CREATED = 'account_created',
  PLAN_SELECTED = 'plan_selected',
  ONBOARDING_COMPLETED = 'onboarding_completed',
}
