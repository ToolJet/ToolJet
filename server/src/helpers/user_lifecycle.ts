import { UnprocessableEntityException } from '@nestjs/common';

export enum lifecycleEvents {
  USER_SIGN_UP = 'USER_SIGN_UP',
  USER_INVITE = 'USER_INVITE',
  USER_VERIFY = 'USER_INVITE_VERIFY',
  USER_REDEEM = 'USER_INVITE_REDEEM',
  USER_SSO_VERIFY = 'USER_SSO_VERIFY',
  USER_SSO_ACTIVATE = 'USER_SSO_ACTIVATE',
  USER_ADMIN_SETUP = 'USER_ADMIN_SETUP',
}

export enum SOURCE {
  INVITE = 'invite',
  SIGNUP = 'signup',
  GOOGLE = 'google',
  GIT = 'git',
  OPENID = 'openid',
}

export enum USER_TYPE {
  INSTANCE = 'instance',
  WORKSPACE = 'workspace',
}

export enum USER_STATUS {
  INVITED = 'invited',
  VERIFIED = 'verified',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum LIMIT_TYPE {
  TOTAL = 'total',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  ALL = 'all',
}

export const URL_SSO_SOURCE = 'sso';

export function getUserErrorMessages(status: any) {
  switch (status) {
    case USER_STATUS.ARCHIVED:
      return 'The user has been archived, please contact the administrator to activate the account';
    default:
      return 'The user is not active, please use the invite link shared to activate';
  }
}

export function getUserStatusAndSource(event: string, source?: any): { source?: source; status: status } {
  switch (event) {
    case lifecycleEvents.USER_SIGN_UP:
      return {
        source: SOURCE.SIGNUP,
        status: USER_STATUS.INVITED,
      };
    case lifecycleEvents.USER_INVITE:
      return {
        source: SOURCE.INVITE,
        status: USER_STATUS.INVITED,
      };
    case lifecycleEvents.USER_VERIFY:
      return {
        source: source || SOURCE.INVITE,
        status: USER_STATUS.VERIFIED,
      };
    case lifecycleEvents.USER_REDEEM:
      return {
        source: source || SOURCE.INVITE,
        status: USER_STATUS.ACTIVE,
      };
    case lifecycleEvents.USER_SSO_VERIFY:
      return {
        source: source,
        status: USER_STATUS.VERIFIED,
      };
    case lifecycleEvents.USER_SSO_ACTIVATE:
      return {
        status: USER_STATUS.ACTIVE,
      };
    case lifecycleEvents.USER_ADMIN_SETUP:
      return {
        source: SOURCE.SIGNUP,
        status: USER_STATUS.ACTIVE,
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

export enum WORKSPACE_USER_STATUS {
  INVITED = 'invited',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

type source = 'google' | 'git' | 'signup' | 'invite' | 'openid';
type status = 'invited' | 'verified' | 'active' | 'archived';
