import {
  Grid3x3, Database, Workflow, Cog, Target, Scale,
  Layers, FileSpreadsheet, Folder, Wand2, LayoutDashboard, Users, UserCheck,
  Lock, UserPlus, ScrollText, Megaphone, Gem, Mail, GitBranch,
  Box, GitMerge, ShoppingBag, Wand, Flag, ShieldCheck, Cloud, Container, Boxes, Server, Telescope, Globe
} from 'lucide-react';

export const featureCards = [
  { 
      icon: Grid3x3, 
      title: "App Builder", 
      color: "text-blue-500", 
      content: "Design and create applications with ToolJet's intuitive app builder, featuring a drag-and-drop interface and powerful pre-built components to streamline development.",
      href: "/docs/app-builder/overview"
  },
  { 
      icon: Database, 
      title: "ToolJet Database", 
      color: "text-blue-500", 
      content: "Powered by PostgreSQL, offering a user-friendly UI editor. ToolJet Database allows you to manage, edit, and interact with your data directly within the platform.",
      href: "/docs/tooljet-db/tooljet-database"
  },
  { 
      icon: Workflow, 
      title: "Workflows", 
      color: "text-blue-500", 
      content: "Automate processes and define workflows with precision, allowing your apps to handle tasks intelligently.",
      href: "/docs/workflows/overview"
  }
];

export const setupCards = [
  { 
      icon: Cog, 
      title: "Try ToolJet", 
      color: "text-blue-500", 
      content: "Get started with ToolJet in under 2 minutes by running it with Docker. Experience a seamless setup and explore the full capabilities of ToolJet.",
      href: "/docs/setup/try-tooljet"
  },
  { 
      icon: Cog, 
      title: "System Requirements", 
      color: "text-blue-500", 
      content: "Ensure your system meets the requirements for running ToolJet. Check hardware and software specifications to get the best performance from the platform.",
      href: "/docs/setup/system-requirements"
  },
  { 
      icon: Target, 
      title: "Choose Your ToolJet", 
      color: "text-blue-500", 
      content: "Discover the ideal ToolJet version for your development needs. Choose between our Long-Term Support (LTS) versions for stability and reliability, or explore Pre-Release versions to access the latest features. Select the option that best aligns with your project requirements ",
      href: "/docs/setup/choose-your-tooljet/"
  },
  { 
      icon: Scale, 
      title: "Upgrade to LTS", 
      color: "text-blue-500", 
      content: "Upgrade to the Long Term Support (LTS) version of ToolJet for extended support, stability, and access to critical updates.",
      href: "/docs/setup/upgrade-to-lts"
  }
];

export const deployOptions = [
  { icon: Cloud, title: "DigitalOcean", href: "/docs/setup/digitalocean" },
  { icon: Container, title: "Docker", href: "/docs/setup/docker" },
  { icon: Server, title: "AWS EC2", href: "/docs/setup/ec2" },
  { icon: Server, title: "AWS ECS", href: "/docs/setup/ecs" },
  { icon: Server, title: "Openshift", href: "/docs/setup/openshift" },
  { icon: Telescope, title: "Helm", href: "/docs/setup/helm" },
  { icon: Boxes, title: "Kubernetes", href: "/docs/setup/kubernetes" },
  { icon: Globe, title: "Kubernetes (GKE)", href: "/docs/setup/kubernetes-gke" },
  { icon: Globe, title: "Kubernetes (AKS)", href: "/docs/setup/kubernetes-aks" },
  { icon: Globe, title: "Kubernetes (EKS)", href: "/docs/setup/kubernetes-eks" },
  { icon: Globe, title: "Azure Container apps", href: "/docs/setup/azure-container" },
  { icon: Globe, title: "Google Cloud Run", href: "/docs/setup/google-cloud-run" },


];

export const dataCards = [
  { 
      icon: Layers, 
      title: "Overview", 
      color: "text-blue-500", 
      content: "Gain a broad understanding of ToolJet's features and capabilities. Learn how it simplifies app development with powerful tools and an intuitive interface.",
      href: "/docs/data-sources/overview"
  },
  { 
      icon: FileSpreadsheet, 
      title: "Sample Data Source", 
      color: "text-blue-500", 
      content: "Explore sample data sources to quickly integrate with ToolJet. Test features and workflows using predefined datasets.",
      href: "/docs/data-sources/sample-data-sources"
  },
  { 
      icon: Folder, 
      title: "Datasource Library", 
      color: "text-blue-500", 
      content: "Browse ToolJet's datasource library to connect with databases, APIs, and external services seamlessly.",
      href: "/docs/tooljet-concepts/what-are-datasources/"
  },
  { 
      icon: Wand2, 
      title: "Transformation", 
      color: "text-blue-500", 
      content: "Leverage ToolJet's transformation capabilities to manipulate and format data from various sources with ease.",
      href: "/docs/tutorial/transformations/"
  }
];

export const organizationCards = [
  { icon: LayoutDashboard, title: "Dashboard", href: "/docs/dashboard" },
  { icon: Users, title: "Workspaces", href: "/docs/org-management/workspaces/workspace_overview" },
  { icon: UserCheck, title: "User authentication", href: "/docs/user-authentication/workspace-login" },
  { icon: Lock, title: "Permissions", href: "/docs/org-management/permissions" },
  { icon: UserPlus, title: "Users and groups", href: "/docs/tutorial/manage-users-groups" },
  { icon: ScrollText, title: "Audit logs", href: "/docs/Enterprise/audit_logs" },
  { icon: Megaphone, title: "White label", href: "/docs/Enterprise/white-label" },
  { icon: Gem, title: "Super admin", href: "/docs/Enterprise/superadmin" },
  { icon: Mail, title: "Licensing", href: "/docs/org-management/licensing/self-hosted" }
];

export const releaseCards = [
  { 
      icon: GitBranch, 
      title: "Git Sync", 
      color: "text-blue-500", 
      content: "Sync your ToolJet projects with Git repositories, enabling version control and collaboration across teams.",
      href: "/docs/gitsync"
  },
  { 
      icon: Box, 
      title: "Multi-Environment", 
      color: "text-blue-500", 
      content: "Easily manage and deploy applications across multiple environments, ensuring smooth transitions between development, staging, and production.",
      href: "/docs/release-management/multi-environment"
  },
  { 
      icon: GitMerge, 
      title: "Versioning and Release", 
      color: "text-blue-500", 
      content: "Implement version control and release management to track changes, roll back updates, and maintain stable app deployments.",
      href: "/docs/tutorial/versioning-and-release"
  }
];

export const resourceCards = [
  { 
      icon: ShoppingBag, 
      title: "Marketplace", 
      color: "text-blue-500", 
      content: "Discover a variety of plugins, extensions and integrations in ToolJet's marketplace to enhance your app-building experience.",
      href: "/docs/marketplace/marketplace-overview"
  },
  { 
      icon: Wand, 
      title: "Copilot", 
      color: "text-blue-500", 
      content: "Boost productivity with ToolJet Copilot. Get AI-powered suggestions and assistance while building your applications.",
      href: "/docs/tooljet-copilot"
  },
  { 
      icon: Flag, 
      title: "Tracking", 
      color: "text-blue-5000", 
      content: "ToolJet ensures user privacy by acting as a proxy, never storing data from sources. It offers anonymous usage tracking with options to disable features for enhanced control.",
      href: "/docs/tracking"
  },
  { 
      icon: ShieldCheck, 
      title: "Security", 
      color: "text-blue-500", 
      content: "ToolJet guarantees your data security with SOC 2 compliance, robust encryption, and secure credential handling. We never store your data, ensuring peace of mind with every connection",
      href: "/docs/security"
  }
];

export const textLabels = {
  title: {
      prefix: "ToolJet",
      highlight: "Documentation"
  },    
  subtitle: "Learn how to get up and running with ToolJet",
  gettingStarted: {
      title: "Getting Started",
      description: "Discover how to create and publish apps within minutes"
  },
  setupToolJet: {
      title: "Setup ToolJet",
      description: "Learn about the different methods you can use to deploy ToolJet"
  },
  deployOn: {
      title: "Deploy on"
  },
  exploreMore: "Explore more details",
  bringData: {
      title: "Bring your data to ToolJet",
      description: "Learn how to connect your data sources to ToolJet"
  },
  manageOrganization: {
      title: "Manage your organization",
      description: "Learn how to secure your apps and manage user authentication in ToolJet."
  },
  manageReleases: {
      title: "Manage releases",
      description: "Learn how you can efficiently control the release cycle in ToolJet"
  },
  additionalResources: {
      title: "Additional resources",
      description: "Learn more about Marketplace Plugins, ToolJet Copilot, App Performance, and Security."
  }
};

export const sectionCards = {
  gettingStarted : {
    title: "Getting Started",
    description: "Discover how to create and publish apps within minutes",
    link: "/docs/getting-started/quickstart-guide",
}
};