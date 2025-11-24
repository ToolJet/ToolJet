import {
    BrainCircuit, Grid3x3, Database, Workflow, Cog, Target, Scale,
    Layers, FileSpreadsheet, Folder, Wand2, LayoutDashboard, Users, UserCheck,
    Lock, UserPlus, ScrollText, Megaphone, Gem, Mail, GitBranch,
    Box, GitMerge, ShoppingBag, Wand, Flag, ShieldCheck, Cloud, Container, Boxes, Server, Telescope, Globe
} from 'lucide-react';

export const featureCards = [
    {
        icon: BrainCircuit,
        title: "Build with AI",
        color: "text-blue-500",
        content: "Build applications effortlessly using natural language to generate and customize apps.",
        href: "/docs/3.5.0-LTS/build-with-ai/overview"
    },
    {
        icon: Grid3x3,
        title: "App Builder",
        color: "text-blue-500",
        content: "Design and create applications with ToolJet's intuitive app builder, featuring a drag-and-drop interface and powerful pre-built components to streamline development.",
        href: "/docs/3.5.0-LTS/app-builder/overview"
    },
    {
        icon: Database,
        title: "ToolJet Database",
        color: "text-blue-500",
        content: "Powered by PostgreSQL, offering a user-friendly UI editor. ToolJet Database allows you to manage, edit, and interact with your data directly within the platform.",
        href: "/docs/3.5.0-LTS/tooljet-db/tooljet-database"
    },
    {
        icon: Workflow,
        title: "Workflows",
        color: "text-blue-500",
        content: "Automate processes and define workflows with precision, allowing your apps to handle tasks intelligently.",
        href: "/docs/3.5.0-LTS/workflows/overview"
    }
];

export const setupCards = [
    {
        icon: Cog,
        title: "Try ToolJet",
        color: "text-blue-500",
        content: "Get started with ToolJet in under 2 minutes by running it with Docker. Experience a seamless setup and explore the full capabilities of ToolJet.",
        href: "/docs/3.5.0-LTS/setup/try-tooljet"
    },
    {
        icon: Cog,
        title: "System Requirements",
        color: "text-blue-500",
        content: "Ensure your system meets the requirements for running ToolJet. Check hardware and software specifications to get the best performance.",
        href: "/docs/3.5.0-LTS/setup/system-requirements"
    },
    {
        icon: Target,
        title: "Choose Your ToolJet",
        color: "text-blue-500",
        content: "Discover the ideal ToolJet version for your development needs. Choose between our LTS versions or explore Pre-Release versions.",
        href: "/docs/3.5.0-LTS/setup/choose-your-tooljet/"
    },
    {
        icon: Scale,
        title: "Upgrade to LTS",
        color: "text-blue-500",
        content: "Upgrade to the Long Term Support (LTS) version of ToolJet for extended support, stability, and access to critical updates.",
        href: "/docs/3.5.0-LTS/setup/upgrade-to-lts"
    }
];

export const deployOptions = [
    { icon: Cloud, title: "DigitalOcean", href: "/docs/3.5.0-LTS/setup/digitalocean" },
    { icon: Container, title: "Docker", href: "/docs/3.5.0-LTS/setup/docker" },
    { icon: Server, title: "AWS AMI", href: "/docs/3.5.0-LTS/setup/ami" },
    { icon: Server, title: "AWS ECS", href: "/docs/3.5.0-LTS/setup/ecs" },
    { icon: Server, title: "Openshift", href: "/docs/3.5.0-LTS/setup/openshift" },
    { icon: Telescope, title: "Helm", href: "/docs/3.5.0-LTS/setup/helm" },
    { icon: Boxes, title: "Kubernetes", href: "/docs/3.5.0-LTS/setup/kubernetes" },
    { icon: Globe, title: "Kubernetes (GKE)", href: "/docs/3.5.0-LTS/setup/kubernetes-gke" },
    { icon: Globe, title: "Kubernetes (AKS)", href: "/docs/3.5.0-LTS/setup/kubernetes-aks" },
    { icon: Globe, title: "Kubernetes (EKS)", href: "/docs/3.5.0-LTS/setup/kubernetes-eks" },
    { icon: Globe, title: "Azure Container Apps", href: "/docs/3.5.0-LTS/setup/azure-container" },
    { icon: Globe, title: "Google Cloud Run", href: "/docs/3.5.0-LTS/setup/google-cloud-run" },


];

export const dataCards = [
    {
        icon: Layers,
        title: "Overview",
        color: "text-blue-500",
        content: "Gain a broad understanding on connecting various data sources to ToolJet.",
        href: "/docs/3.5.0-LTS/data-sources/overview"
    },
    {
        icon: FileSpreadsheet,
        title: "Sample Data Source",
        color: "text-blue-500",
        content: "Explore sample data sources to quickly integrate with ToolJet. Test features and workflows using predefined datasets.",
        href: "/docs/3.5.0-LTS/data-sources/sample-data-sources"
    },
    {
        icon: Folder,
        title: "Data Source Library",
        color: "text-blue-500",
        content: "Browse ToolJet's data source library to connect with databases, APIs, and external services seamlessly.",
        href: "/docs/3.5.0-LTS/data-sources/overview"
    },
    {
        icon: Wand2,
        title: "Transformation",
        color: "text-blue-500",
        content: "Leverage ToolJet's transformation capabilities to manipulate and format data from various sources with ease.",
        href: "/docs/3.5.0-LTS/tutorial/transformations/"
    }
];

export const organizationCards = [
    { icon: Users, title: "Workspaces", href: "/docs/3.5.0-LTS/tj-setup/workspaces" },
    { icon: UserCheck, title: "User authentication", href: "/docs/3.5.0-LTS/user-management/authentication/self-hosted/overview" },
    { icon: Lock, title: "Permissions", href: "/docs/3.5.0-LTS/user-management/role-based-access/access-control" },
    { icon: UserPlus, title: "Users and groups", href: "/docs/3.5.0-LTS/user-management/role-based-access/user-roles" },
    { icon: ScrollText, title: "Audit logs", href: "/docs/3.5.0-LTS/security/audit-logs" },
    { icon: Megaphone, title: "White label", href: "/docs/3.5.0-LTS/tj-setup/org-branding/white-labeling" },
    { icon: Gem, title: "Super admin", href: "/docs/3.5.0-LTS/user-management/role-based-access/super-admin" },
    { icon: Mail, title: "Licensing", href: "/docs/3.5.0-LTS/tj-setup/licensing/self-hosted" }
];

export const releaseCards = [
    {
        icon: GitBranch,
        title: "Git Sync",
        color: "text-blue-500",
        content: "Sync your ToolJet projects with Git repositories, enabling version control and collaboration across teams.",
        href: "/docs/3.5.0-LTS/development-lifecycle/gitsync/overview"
    },
    {
        icon: Box,
        title: "Multi-Environment",
        color: "text-blue-500",
        content: "Easily manage and deploy applications across multiple environments, ensuring smooth transitions between development, staging, and production.",
        href: "/docs/3.5.0-LTS/development-lifecycle/environment/self-hosted/multi-environment"
    },
    {
        icon: GitMerge,
        title: "Versioning and Release",
        color: "text-blue-500",
        content: "Implement version control and release management to track changes, roll back updates, and maintain stable app deployments.",
        href: "/docs/3.5.0-LTS/development-lifecycle/release/version-control"
    }
];

export const resourceCards = [
    {
        icon: ShoppingBag,
        title: "Marketplace",
        color: "text-blue-500",
        content: "Discover a variety of plugins, extensions and integrations in ToolJet's marketplace to enhance your app-building experience.",
        href: "/docs/3.5.0-LTS/marketplace/marketplace-overview"
    },
    {
        icon: Flag,
        title: "Tracking",
        color: "text-blue-5000",
        content: "ToolJet ensures privacy by acting as a proxy, never storing data, and offers anonymous tracking with feature controls.",
        href: "/docs/3.5.0-LTS/tracking"
    },
    {
        icon: ShieldCheck,
        title: "Security",
        color: "text-blue-500",
        content: "ToolJet ensures data security with SOC 2 compliance, encryption, and secure credential handling, never storing your data.",
        href: "/docs/3.5.0-LTS/security/compliance"
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
        title: "Deployment"
    },
    exploreMore: "Explore more",
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
    gettingStarted: {
        title: "Getting Started",
        description: "Discover how to create and publish apps within minutes",
        link: "/docs/3.5.0-LTS/getting-started/quickstart-guide",
    }
};