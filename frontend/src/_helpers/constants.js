export const USER_COLORS = [
  '#1a1c2c',
  '#5d275d',
  '#b13e53',
  '#ef7d57',
  '#ffcd75',
  '#a7f070',
  '#38b764',
  '#257179',
  '#29366f',
  '#3b5dc9',
  '#41a6f6',
  '#73eff7',
  '#94b0c2',
  '#566c86',
  '#333c57',
];

export const ON_BOARDING_SIZE = ['1-10', '11-50', '51-100', '101-500', '501-1000', '1000+'];

export const ON_BOARDING_ROLES = [
  'Head of engineering',
  'Head of product',
  'CIO/CTO',
  'Software engineer',
  'Data scientist',
  'Product manager',
  'Other',
];

export const ERROR_TYPES = {
  URL_UNAVAILABLE: 'url-unavailable',
  RESTRICTED: 'restricted',
  NO_ACCESSIBLE_PAGES: 'no-accessible-pages',
  INVALID: 'invalid-link',
  UNKNOWN: 'unknown',
  WORKSPACE_ARCHIVED: 'Organization is Archived',
  USERS_EXCEEDING_LICENSE_LIMIT: 'user-count-exceeding',
  WORKSPACE_LOGIN_RESTRICTED: 'ws-login-restricted',
  RESTRICTED_PREVIEW: 'restricted-preview',
  PUBLIC_APP_PLAN_RESTRICTED: 'public-app-plan-restricted',
  WORKSPACE_SUSPENDED: 'workspace-suspended',
  USER_SUSPENDED: 'user-suspended',
};

export const ERROR_MESSAGES = {
  'url-unavailable': {
    title: 'App Unavailable',
    message: 'This app has not been released yet. Release the app or contact your administrator for access.',
    cta: 'Back to home page',
    queryParams: [],
  },
  restricted: {
    title: 'Access Restricted',
    message: "You don't have access to this app. Contact your administrator for more information.",
    cta: 'Back to home page',
    retry: false,
    queryParams: [],
  },
  'restricted-preview': {
    title: 'Access Restricted',
    message: 'Access to this preview environment is restricted. Contact your administrator for more information.',
    retry: false,
    cta: 'Back to home page',
    queryParams: [],
  },
  'public-app-plan-restricted': {
    title: 'Feature not available',
    message: 'Public apps are not available in your plan. Please upgrade to share this app.',
    cta: 'Back to home page',
    retry: false,
    queryParams: [],
  },
  'no-accessible-pages': {
    title: 'Access Restricted',
    message: "You don't have access to any pages in this app. Contact your administrator for more information.",
    retry: false,
    queryParams: [],
  },
  'ws-login-restricted': {
    title: 'Restricted access',
    message: 'Workspace login is not enabled for this instance. Contact your super admin to configure access.',
    cta: 'Back to home page',
    retry: false,
    queryParams: [],
  },
  'invalid-link': {
    title: 'Invalid link',
    message: 'The link is invalid. Please verify the link and try again.',
    cta: 'Back to home page',
    retry: false,
    queryParams: [],
  },
  'invalid-invite-session': {
    title: 'Session Mismatch',
    message: 'The current session does not match the invitation. Please log out and try again.',
    cta: 'Back to home page',
    queryParams: [],
  },
  'no-active-workspace': {
    title: 'No Active Workspaces',
    message: 'No active workspaces found for your account. Contact your administrator for assistance.',
    queryParams: [],
  },
  unknown: {
    title: 'Something Went Wrong',
    message: 'An error occurred while loading the app. Please try again or contact your administrator.',
    cta: 'Back to home page',
    retry: true,
    queryParams: [],
  },
  'user-count-exceeding': {
    title: 'User Limit Exceeded',
    message:
      "Your builder or end-user count exceeds your plan's limit. Archive users or upgrade your plan to continue.",
    retry: false,
    icon: 'user',
  },
  'app-count-exceeding': {
    title: 'App Limit Exceeded',
    message: "The number of apps exceeds your plan's limit. Delete apps or upgrade your plan to continue.",
    retry: false,
    icon: 'apps',
  },
  'invited-workspace-archived': {
    title: 'Workspace Archived',
    message: 'The workspace you were invited to has been archived. Contact your administrator for more information.',
    cta: 'Back to home page',
    queryParams: [],
  },
  'user-is-not-activated': {
    title: 'Account not activated',
    message: 'Your account is not activated yet. Please check your email for an activation link.',
    cta: 'Back to home page',
    queryParams: [],
  },
  'workspace-suspended': {
    title: 'This workspace has been suspended',
    message: '{workspaceName} has been suspended by ToolJet. To restore access, contact ToolJet support.',
    queryParams: [],
  },
  'user-suspended': {
    title: "You've been signed out",
    message: 'This account has been suspended by ToolJet. Contact ToolJet support for help.',
    queryParams: [],
  },
};

export const DEFAULT_ERROR_MESSAGE = {
  title: 'Unknown error',
  message: 'Please try again.',
};

export const TOOLTIP_MESSAGES = {
  SHARE_URL_UNAVAILABLE: 'Share URL is unavailable until the current version is released.',
  RELEASE_VERSION_URL_UNAVAILABLE: 'Release this version to make it publicly accessible.',
};

export const DATA_SOURCE_TYPE = {
  SAMPLE: 'sample',
  LOCAL: 'local',
  GLOBAL: 'global',
  STATIC: 'static',
  DEFAULT: 'default',
};

export const SAMPLE_DB_KIND = {
  POSTGRESQL: 'postgresql',
  TOOLJET_DB: 'tooljetdb',
};

export const PLANS = {
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise',
  TRIAL: 'trial',
  STARTER: 'starter',
};
