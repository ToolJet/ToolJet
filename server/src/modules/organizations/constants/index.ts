import { DataBaseConstraints } from '@helpers/db_constraints.constants';

export const ERROR_HANDLER = {
  DUPLICATE_EMAIL_PRESENT: 'Duplicate email found. Please provide a unique email address.',
};

export const ERROR_HANDLER_TITLE = {
  DUPLICATE_EMAIL_PRESENT: 'Duplicate email',
};

export const CONSTRAINTS = [
  {
    dbConstraint: DataBaseConstraints.WORKSPACE_NAME_UNIQUE,
    message: 'This workspace name is already taken.',
  },
  {
    dbConstraint: DataBaseConstraints.WORKSPACE_SLUG_UNIQUE,
    message: 'This workspace slug is already taken.',
  },
];

export enum FEATURE_KEY {
  GET = 'get',
  UPDATE = 'update',
  WORKSPACE_STATUS_UPDATE = 'status_update',
  CHECK_UNIQUE = 'check_unique',
  CREATE = 'create',
  CHECK_UNIQUE_ONBOARDING = 'check_unique_onboarding',
  SET_DEFAULT = 'set_default',
}
