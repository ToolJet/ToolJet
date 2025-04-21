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

  // Password Management
  FORGOT_PASSWORD = 'forgotPassword', // POST 'forgot-password'
  RESET_PASSWORD = 'resetPassword', // POST 'reset-password'

  // Oauth
  OAUTH_SIGN_IN = '/oauth/sign-in/:configId',
  OAUTH_OPENID_CONFIGS = '/oauth/configs/:configId',
  OAUTH_SAML_CONFIGS = '/oauth/saml/configs/:configId',
  OAUTH_COMMON_SIGN_IN = '/oauth/sign-in/common/:ssoType',
  OAUTH_SAML_RESPONSE = '/oauth/saml/:configId',
}
