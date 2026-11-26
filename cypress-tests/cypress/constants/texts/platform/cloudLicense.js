export const cloudLicenseText = {
  navBar: {
    daysLeft: (days) => `${days} days left`,
    trialEndsToday: "Trial ends today",
    startTrial: "Start 14-day trial",
    upgrade: "Upgrade",
    consultation: "Get a free consultation",
  },

  customGroupsBanner: {
    heading: "Custom groups & permissions are paid features",
    adminInfo:
      "Upgrade to a paid plan to continue accessing premium features in this workspace",
    startFreeTrial: "Start free trial",
    upgrade: "Upgrade",
  },

  generatingTrial: "Generating trial license key..",
  trialLimitedError:
    "Trials are limited to one per account, on the workspace you signed up with. To request another trial, contact hello@tooljet.com.",

  apps: {
    nearing: (current, total) => `App limit nearing - ${current}/${total}`,
    reached: "App limit reached",
    nearingInfoAdmin: "You're nearing your limit for number of apps. Upgrade for more",
    nearingInfoBuilder:
      "You're nearing your limit for number of apps. Contact admin to know more",
    reachedInfoAdmin: "You've reached your limit for number of apps. Upgrade for more",
  },

  database: {
    nearing: "Database limit nearing",
    reached: "Database limit reached",
    nearingInfo: "You're nearing your plan limits for ToolJet database. Upgrade for more.",
    reachedInfo: "You've reached your plan limits for ToolJet database. Upgrade for more.",
    tablesRow: (current, total) => `Tables${current}/${total}`,
    tableLimitError:
      "You have reached your workspace's maximum limit for ToolJet Database tables.",
  },

  upgradeModal: {
    title: "Upgrade your plan",
    plans: ["free", "basic", "pro", "team", "enterprise"],
    planNames: {
      free: "Free",
      basic: "Basic",
      pro: "Pro",
      team: "Team",
      enterprise: "Enterprise",
    },
    monthly: "Monthly",
    yearly: "Annual",
    currentPlan: "Current plan",
    upgrade: "Upgrade",
    scheduleCall: "Schedule a call",
  },

  publicAppRestricted: {
    code: "public-app-plan-restricted",
    title: "Feature not available",
    message: "Public apps are not available in your plan. Please upgrade to share this app.",
  },
};
