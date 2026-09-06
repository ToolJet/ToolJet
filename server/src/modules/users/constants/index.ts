export enum FEATURE_KEY {
  GET_ALL_USERS = 'GET_ALL_USERS',
  UPDATE_USER_TYPE = 'UPDATE_USER_TYPE',
  AUTO_UPDATE_USER_PASSWORD = 'AUTO_UPDATE_USER_PASSWORD',
  CHANGE_USER_PASSWORD = 'CHANGE_USER_PASSWORD',
  UPDATE_USER_TYPE_INSTANCE = 'UPDATE_USER_TYPE_INSTANCE',
}

export const SAFE_USER_SELECT_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  status: true,
  source: true,
  onboardingStatus: true,
  userType: true,
  avatarId: true,
  defaultOrganizationId: true,
  companyName: true,
  role: true,
  companySize: true,
  autoActivated: true,
  createdAt: true,
  updatedAt: true,
};

export const SAFE_USER_QB_COLUMNS = [
  'user.id',
  'user.email',
  'user.firstName',
  'user.lastName',
  'user.phoneNumber',
  'user.status',
  'user.source',
  'user.onboardingStatus',
  'user.userType',
  'user.avatarId',
  'user.defaultOrganizationId',
  'user.companyName',
  'user.role',
  'user.companySize',
  'user.autoActivated',
  'user.createdAt',
  'user.updatedAt',
];

