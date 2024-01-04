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
  unknown: {
    title: 'Oops, something went wrong!',
    message: 'An error occurred while loading the app. Please try again or contact admin.',
    cta: 'Back to home page',
    retry: true,
    queryParams: [],
  },
};

export const TOOLTIP_MESSAGES = {
  SHARE_URL_UNAVAILABLE: 'Share URL is unavailable until current version is released',
};
