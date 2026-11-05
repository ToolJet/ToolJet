export enum FEATURE_KEY {
  GET_CODE_PAGE_SECURITY = 'GET_CODE_PAGE_SECURITY',
  UPDATE_CODE_PAGE_SECURITY = 'UPDATE_CODE_PAGE_SECURITY',
}

/** The directives an admin may extend, as the policy names them. */
export const CSP_DIRECTIVES = ['connect-src', 'img-src', 'font-src', 'media-src', 'style-src', 'script-src', 'frame-src'] as const;
export type CspDirective = (typeof CSP_DIRECTIVES)[number];

export const MAX_ORIGINS_PER_DIRECTIVE = 25;
