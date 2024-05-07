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
  INVALID: 'invalid-link',
  UNKNOWN: 'unknown',
};

export const ERROR_MESSAGES = {
  'url-unavailable': {
    title: 'App URL Unavailable',
    message:
      'The app URL is currently unavailable because the app has not been released. Please either release it or contact admin for access.',
    cta: 'Back to home page',
    queryParams: [],
  },
  restricted: {
    title: 'Restricted access',
    message: 'You don’t have access to this app. Kindly contact admin to know more.',
    cta: 'Back to home page',
    retry: false,
    queryParams: [],
  },
  'invalid-link': {
    title: 'Invalid link',
    message: 'The link you provided is invalid. Please check the link and try again.',
    cta: 'Back to home page',
    retry: false,
    queryParams: [],
  },
  'invalid-invite-session': {
    title: 'Incorrect email address',
    message: 'The user details of the active session does not match that of the invite. Please log out and try again.',
    cta: 'Back to home page',
    queryParams: [],
  },
  'no-active-workspace': {
    title: 'No active workspaces',
    message: 'No active workspace were found for this user. Kindly contact admin to know more.',
    queryParams: [],
  },
  unknown: {
    title: 'Oops, something went wrong!',
    message: 'An error occurred while loading the app. Please try again or contact admin.',
    cta: 'Back to home page',
    retry: true,
    queryParams: [],
  },
  'invited-workspace-archived': {
    title: 'Archived workspace',
    message: 'The workspace you are invited to has been archived. Kindly contact admin to know more.',
    cta: 'Back to home page',
    queryParams: [],
  },
  'user-is-not-activated': {
    title: 'Account not activated',
    message: 'Your account is not activated yet. Please check your email for activation link.',
    cta: 'Back to home page',
    queryParams: [],
  },
};

export const TOOLTIP_MESSAGES = {
  SHARE_URL_UNAVAILABLE: 'Share URL is unavailable until current version is released',
};

export const DATA_SOURCE_TYPE = {
  SAMPLE: 'sample',
  LOCAL: 'local',
  GLOBAL: 'global',
};

export const SAMPLE_DB_KIND = {
  POSTGRESQL: 'postgresql',
  TOOLJET_DB: 'tooljetdb',
};
