export const ssoText = {
  pagetitle: " Workspace login",

  workspaceLoginPage: {
    cardTitle: "Instance login",
    allowedDomainLabel: "Allowed domains",
    allowedDomainInput: "",
    allowedDomainHelperText: "Support multiple domains. Enter allowed domains names separated by comma. example: tooljet.com,tooljet.io,yourorganization.com",
    superAdminUrlLabel: "Super admin login URL",
    superAdminUrl: "http://localhost:8082/login/super-admin",
    superAdminUrlHelperText: "Use this URL for super admin to login via password",
    enableSignupLabel: "Enable Signup",
    enableSignupHelperText: "Users will be able to sign up without being invited",
    passwordLoginLabel: "Password login",
    passwordDisableHelperText: 'Disable password login only if your SSO is configured otherwise you will get locked out',
    workspaceConfigurationLabel: "Enable workspace configuration",
    workspaceConfigurationHelperText: "Allow workspace admin to configure their workspace’s login differently",
    autoSSOLabel: "Automatic SSO login",
    autoSSOHelperText: "This will simulate the configured SSO login, bypassing the login screen in ToolJet",
    instanceLogoutTitle: "Instance logout",
    customLogoutUrlLabel: "Custom logout URL",
    customLogoutUrlPlaceholder: "",
    customLogoutUrlHelperText: "Set a personalized logout URL for users logging out of this instance.",
    ssoHeader: "SSO",
    googleLabel: "Google",
    githubLabel: "GitHub",
    oidcLabel: "OpenID Connect",
  },
  cancelButton: "Cancel",
  saveButton: "Save changes",
  allowedDomain: "tooljet.io,gmail.com",
  passwordDisableWarning: "Please ensure SSO is configured successfully before disabling password login or else you will get locked out. Are you sure you want to continue?",
  superAdminInfoText: "Super admin can still access their account via http://localhost:8082/login/super-admin",
  ssoToast: "Organization settings have been updated",
  ssoToast2: "updated SSO configurations",
  googleTitle: "Google",
  enabledLabel: "Enabled",
  googleSSOToast: "Saved Google SSO configurations",
  disabledLabel: "Disabled",
  googleDisableToast: "Disabled Google SSO",
  googleSSOText: "Sign in with Google",
  clientIdLabel: "Client ID",
  redirectUrlLabel: "Redirect URL",
  clientId: "24567098-mklj8t20za1smb2if.apps.googleusercontent.com",
  testClientId: "12345-client-id-.apps.googleusercontent.com",
  gitTitle: "GitHub",
  clientSecretLabel: "Client secret",
  encriptedLabel: "Encrypted",
  gitEnabledToast: "Enabled GitHub SSO",
  gitSSOToast: "Saved Git SSO configurations",
  gitSignInText: "Sign in with GitHub",
  passwordTitle: "Password Login",
  passwordEnabledToast: "Enabled Password login",
  passwordDisabledToast: "Password login disabled successfully!",
  passwordDisableHelperText:
    "Disable password login only if you have configured SSO or else you will get locked out.",
  disablePasswordLoginTitle: 'Disable password login',
  hostNameLabel: "Host name",
  hostNameHelpText: "Required if GitHub is self hosted",
  hostName: "Tooljet",
  signInHeader: "Sign in",
  autoSSOToggleMessage: "Can be enabled only if password login is disabled & there's only one SSO enabled",
  workspaceSubHeader: (workspaceName) => {
    return `Sign in to your workspace - ${workspaceName}`;
  },
  noLoginMethodWarning: "No login methods enabled for this workspace",
  googleSignUpText: "Sign up with Google",
  gitSignUpText: "Sign up with GitHub",
  gitUserStatusToast:
    "GitHub login failed - User does not exist in the workspace",
  passwordLoginToggleLbale: "Password login",
  alertText: "Danger zone",
  disablePasswordHelperText:
    "Disable password login only if your SSO is configured otherwise you will get locked out",
  disablePasswordHelperText:
    "Disable password login only if your SSO is configured otherwise you will get locked out",
  toggleUpdateToast: (toggle) => {
    return `Saved ${toggle} SSO configurations`;
  },
};

export const ssoEeText = {
  samlModalElements: {
    toggleLabel: "SAML",
    NameLabel: "Name",
    metaDataLabel: "Identity provider metadata",
    baseDNHelperText:
      "Ensure the Identity provider metadata is in XML format. You can download it from your IdP's site",
    groupAttributeLabel: "Group attribute",
    groupAttributeHelperText:
      "Define attribute for user-to-group mapping based on the IdP",
  },
  enabledLabel: "Enabled",
  testclientId: "test-client-id",

};
