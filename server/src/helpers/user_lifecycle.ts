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
};

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

type source = 'google' | 'git' | 'signup' | 'invite';
type status = 'invited' | 'verified' | 'active' | 'archived';
