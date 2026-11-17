export const cloudSubscriptionText = {
  subscriptionPath: (workspaceId) => `/${workspaceId}/settings/subscription`,
  subscriptionOverview: "Subscription overview",
  subscriptionLimits: "SUBSCRIPTION LIMITS",
  featureAccess: "FEATURE ACCESS",
  exceedingLimit: "Exceeding Limit",
  unlimited: "Unlimited",

  planTags: {
    basic: "Free plan",
    trial: "Trial plan",
    business: "Business plan",
    basicplus: "Basic plan",
    pro: "Pro plan",
    team: "Team plan",
  },

  // Display label on the page -> key in the limits API response
  limitLabels: {
    totalUsers: "Total users",
    builders: "Builders",
    endUsers: "End users",
    apps: "Apps",
    tables: "Tables",
    rows: "Rows",
  },

  // Feature access labels keyed by the /api/license/access field they reflect
  featureLabels: {
    customGroups: "Custom user groups",
    google: "Google SSO",
    github: "GitHub SSO",
    openid: "OpenID Connect (OIDC)",
    ldap: "LDAP",
    saml: "SAML",
    auditLogs: "Audit logs",
    multiEnvironment: "Multi-environment",
    gitSync: "GitSync",
    workspaceEnv: "Environment mapping",
    multiPlayerEdit: "Multiplayer editing",
    modulesEnabled: "Modules",
    customThemes: "Themes",
    customStyling: "Custom styles",
    appPagesAddNavGroupEnabled: "App navigation group",
  },
  dynamicAccessRules: "Dynamic access rules",
  devLifecyclePermissions: "Dev lifecycle permissions",

  comparePlans: "Compare plans",
  upgrade: "Upgrade",
  pricingPageUrl: "https://www.tooljet.com/pricing",
  viewInvoices: "View invoices",
  manageSubscription: "Manage subscription",
  pricesUnavailableTotal: "—/year",
  dueToday: "Due today",
  nextDueOn: (date) => `Next due on ${date}`,

  pricingModalPlans: ["free", "basic", "pro", "team", "enterprise"],
  upgradePlanModalTitle: "Upgrade plan",
  manageSubscriptionModalTitle: "Manage subscription",
  payMonthly: "Pay monthly",
  payYearly: "Pay yearly",

  paymentSuccessToast: "Payment success, your account will be upgraded shortly",
  paymentFailureToast: "Plan could not be upgraded. Please try again!",
  forbiddenMessage: "You do not have permission to access this resource",
};
