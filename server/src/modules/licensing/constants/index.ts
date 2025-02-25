export const PLAN_DETAILS = {
  plans: [
    {
      id: 'basic',
      name: 'Basic Plan',
      builderPrice: 0,
      endUserPrice: 0,
      billingCycle: 'month',
      perUser: true,
      features: ['Unlimited Applications', 'SSO (Google & Github)', 'Community support', 'Pre-defined user groups'],
      additionalInfo: null,
    },
    {
      id: 'flexible',
      name: 'Flexible',
      builderPrice: 30,
      endUserPrice: null,
      billingCycle: 'month',
      perUser: false,
      features: [
        'Unlimited builders & end users at no extra cost',
        'SSO (Okta, Google, OpenID Connect & more)',
        'Granular access control',
        '$5/month per ToolJet table',
        '$20/month per workflow',
      ],
      additionalInfo: {
        addOns: [
          {
            name: 'Multi-environments',
            price: 150,
            billingCycle: 'month',
          },
          {
            name: 'Git sync',
            price: 150,
            billingCycle: 'month',
          },
          {
            name: 'Custom branding/white labelling',
            price: 150,
            billingCycle: 'month',
          },
          {
            name: 'Audit logs',
            price: 150,
            billingCycle: 'month',
          },
        ],
        notes: ['**5 pages per application'],
      },
    },
    {
      id: 'business',
      name: 'Business',
      builderPrice: 24,
      endUserPrice: 8,
      billingCycle: 'month',
      perUser: true,
      features: [
        'SSO (Okta, Google, OpenID Connect & more)',
        'Granular access control',
        'Custom branding/white labelling',
        'Audit logs',
        'Unlimited ToolJet tables and rows',
        'Multiple environments',
        'Air-gapped deployment',
        'Priority support via email',
        'Super admin dashboard',
        'Git sync',
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
        'All features of Business plan',
        'Multi-instance deployments',
        'Dedicated support via email & slack',
        'Access to our experts while building apps',
        'Build first app with our engineers',
        'Custom integrations',
        'SLA',
        'Managed hosting',
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
