export const PLAN_DETAILS = {
  plans: [
    {
      id: 'basic',
      name: 'Basic Plan',
      builderPrice: 0,
      endUserPrice: 0,
      billingCycle: 'month',
      perUser: true,
      features: [
        '2 builders',
        '50 end users',
        '2 apps',
        '30 shared AI credits/month',
        'Pre-defined user roles',
        'Community support via Slack',
      ],
      additionalInfo: null,
    },
    {
      id: 'flexible',
      name: 'Pro',
      builderPrice: 79,
      endUserPrice: null,
      billingCycle: 'month',
      perUser: false,
      features: [
        'All Free features, plus',
        'Unlimited builders',
        'An additional 50 end users',
        'Up to 5 apps',
        '200 AI credits per builder/month',
        'Custom styling',
        'Application white labelling',
        'Version control',
        'Email support',
      ],
    },
    {
      id: 'business',
      name: 'Team',
      builderPrice: 199,
      billingCycle: 'month',
      perUser: true,
      features: [
        'All Pro features, plus',
        'Unlimited end users',
        'Unlimited apps',
        '500 AI credits per builder/month',
        'SSO integration',
        'Custom user groups',
        'Entire platform white labelling',
        'Super admin dashboard',
        'Audit logs',
        'Git sync',
        'Multi-environment (dev/staging/prod)',
        'Priority support portal access',
      ],
      additionalInfo: {
        discount: {
          yearly: 20,
        },
      },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      builderPrice: null,
      endUserPrice: null,
      billingCycle: null,
      perUser: null,
      features: [
        'All team features, plus',
        'Custom AI credits',
        'Custom AI model options',
        'Multi-instance deployments',
        'Air-gapped deployment',
        'Custom data retention policies',
        'Premium SLAs',
        'Optional: support manager',
        'Optional: Dedicated expert',
        'Optional: Custom training',
      ],
      additionalInfo: {
        customPricing: true,
      },
    },
  ],
  currentPlan: 'basic',
};

export const LICENSE_TRIAL_API = process.env.TJ_LICENSE_TRIAL_API || 'https://albecs.tooljet.com/api/license/trial';

export enum LICENSE_FIELD {
  IS_EXPIRED = 'expired',
  APP_COUNT = 'appCount',
  TABLE_COUNT = 'tableCount',
  TOTAL_USERS = 'usersCount',
  EDITORS = 'editorsCount',
  VIEWERS = 'viewersCount',
  OIDC = 'oidcEnabled',
  LDAP = 'ldapEnabled',
  SAML = 'samlEnabled',
  CUSTOM_STYLE = 'customStylingEnabled',
  WHITE_LABEL = 'whitelabellingEnabled',
  CUSTOM_THEMES = 'customThemeEnabled',
  SERVER_SIDE_GLOBAL = 'serverSideGlobalEnabled',
  AUDIT_LOGS = 'auditLogsEnabled',
  MAX_DURATION_FOR_AUDIT_LOGS = 'maxDaysForAuditLogs',
  MULTI_ENVIRONMENT = 'multiEnvironmentEnabled',
  UPDATED_AT = 'updatedAt',
  ALL = 'all',
  USER = 'allUsers',
  VALID = 'valid',
  WORKSPACES = 'workspaces',
  FEATURES = 'features',
  DOMAINS = 'domains',
  STATUS = 'status',
  META = 'metadata',
  WORKFLOWS = 'workflows',
  GIT_SYNC = 'gitSyncEnabled',
  AI = 'ai',
  AI_FEATURE = 'aiEnabled',
  EXTERNAL_API = 'externalApiEnabled',
}

export enum LICENSE_LIMITS_LABEL {
  //Users
  USERS = 'Total Users',
  SUPERADMINS = 'Superadmins',
  EDIT_USERS = 'Builders',
  END_USERS = 'End Users',
  SUPERADMIN_USERS = 'Super Admins',

  //Apps
  APPS = 'Apps',
  WORKFLOWS = 'Workflows',

  //Workspaces
  WORKSPACES = 'Workspaces',

  //Tables
  TABLES = 'Tables',
}

export enum LICENSE_TYPE {
  BASIC = 'basic',
  TRIAL = 'trial',
  ENTERPRISE = 'enterprise',
  BUSINESS = 'business',
}

export enum LICENSE_LIMIT {
  UNLIMITED = 'UNLIMITED',
}

export enum FEATURE_KEY {
  GET_LICENSE = 'get_license',
  GET_PLANS = 'get_plans',
  GET_ACCESS = 'get_access',
  GET_DOMAINS = 'get_domains',
  GET_TERMS = 'get_terms',
  UPDATE_LICENSE = 'update_license',
  GET_APP_LIMITS = 'get_app_limits',
  CHECK_AUDIT_LOGS_LICENSE = 'check_audit_logs_license',
  GET_AUDIT_LOGS_MAX_DURATION = 'get_audit_logs_max_duration',
  GET_ORGANIZATION_LIMITS = 'get_organization_limits',
  GET_USER_LIMITS = 'get_user_limits',
  GET_WORKFLOW_LIMITS = 'get_workflow_limits',
}
