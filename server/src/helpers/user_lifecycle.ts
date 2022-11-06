import { UnprocessableEntityException } from '@nestjs/common';

export const lifecycleEvents = {
  USER_SIGN_UP: 'USER_SIGN_UP',
  USER_INVITE: 'USER_INVITE',
  USER_VERIFY: 'USER_INVITE_VERIFY',
  USER_REDEEM: 'USER_INVITE_REDEEM',
  USER_SSO_VERIFY: 'USER_SSO_VERIFY',
  USER_SSO_ACTIVATE: 'USER_SSO_ACTIVATE',
};

export const SOURCE: Record<string, source> = {
  INVITE: 'invite',
  SIGNUP: 'signup',
  GOOGLE: 'google',
  GIT: 'git',
};

export const LIFECYCLE: Record<string, status> = {
  INVITED: 'invited',
  VERIFIED: 'verified',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
};

export const URL_SSO_SOURCE = 'sso';

export function getUserErrorMessages(status: any) {
  switch (status) {
    case LIFECYCLE.ARCHIVED:
      return 'The user has been archived, please contact the administrator to activate your account';
    default:
      return 'The user is not active, please use the invite link shared to activate';
  }
}

export function getUserStatusAndSource(event: string, source?: any): { source?: source; status: status } {
  switch (event) {
    case lifecycleEvents.USER_SIGN_UP:
      return {
        source: SOURCE.SIGNUP,
        status: LIFECYCLE.INVITED,
      };
    case lifecycleEvents.USER_INVITE:
      return {
        source: SOURCE.INVITE,
        status: LIFECYCLE.INVITED,
      };
    case lifecycleEvents.USER_VERIFY:
      return {
        source: source || SOURCE.INVITE,
        status: LIFECYCLE.VERIFIED,
      };
    case lifecycleEvents.USER_REDEEM:
      return {
        source: source || SOURCE.INVITE,
        status: LIFECYCLE.ACTIVE,
      };
    case lifecycleEvents.USER_SSO_VERIFY:
      return {
        source: source,
        status: LIFECYCLE.VERIFIED,
      };
    case lifecycleEvents.USER_SSO_ACTIVATE:
      return {
        status: LIFECYCLE.ACTIVE,
      };
    default:
      throw new UnprocessableEntityException();
  }
}

export function isPasswordMandatory(source: any): boolean {
  if (source !== SOURCE.SIGNUP) {
    return true;
  }
  return false;
}

export const WORKSPACE_USER_STATUS = {
  INVITED: 'invited',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
};

type source = 'google' | 'git' | 'signup' | 'invite';
type status = 'invited' | 'verified' | 'active' | 'archived';
