import {
    Grid3x3, Database, Workflow, Cog, Target, Scale,
    Layers, FileSpreadsheet, Folder, Wand2, LayoutDashboard, Users, UserCheck,
    Lock, UserPlus, ScrollText, Megaphone, Gem, Mail, GitBranch,
    Box, GitMerge, ShoppingBag, Wand, Flag, ShieldCheck, Cloud, Container, Boxes, Server, Telescope, Globe
} from 'lucide-react';

export const featureCards = [
    { icon: Grid3x3, title: "App Builder", color: "text-blue-500", content: "Design and create applications effortlessly with ToolJet's intuitive app builder, featuring a drag-and-drop interface and powerful pre-built components to streamline development." },
    { icon: Database, title: "ToolJet Database", color: "text-blue-500", content: "Powered by PostgreSQL, offering a user-friendly UI editor. This allows you to manage, edit, and interact with your data directly within the platform." },
    { icon: Workflow, title: "Workflows", color: "text-blue-500", content: "Automate processes and define workflows with precision, empowering your apps to handle tasks intelligently." }
];

export const setupCards = [
    { icon: Cog, title: "Try ToolJet", color: "text-blue-500", content: "Get started with ToolJet in under 2 minutes by running it with Docker. Experience a seamless setup and explore the full capabilities of ToolJet's app builder right on your machine." },
    { icon: Cog, title: "System Requirements", color: "text-blue-500", content: "Ensure your system meets the requirements for running ToolJet. Check hardware and software specifications to get the best performance from the platform." },
    { icon: Target, title: "Choose Your ToolJet", color: "text-blue-500", content: "Find the right ToolJet plan that fits your needs. Compare features and pricing to select the best option for your development workflow." },
    { icon: Scale, title: "Upgrade to LTS", color: "text-blue-500", content: "Upgrade to the Long Term Support (LTS) version of ToolJet for extended support, stability, and access to critical updates." }
];

export const deployOptions = [
    { icon: Cloud, title: "DigitalOcean" },
    { icon: Container, title: "Docker" },
    { icon: Server, title: "AWS EC2" },
    { icon: Server, title: "AWS ECS" },
    { icon: Server, title: "Openshift" },
    { icon: Telescope, title: "Helm" },
    { icon: Boxes, title: "Kubernetes" },
    { icon: Globe, title: "Kubernetes (GKE)" },
    { icon: Globe, title: "Kubernetes (AKS)" },
    { icon: Globe, title: "Kubernetes (EKS)" },
];

export const dataCards = [
    { icon: Layers, title: "Overview", color: "text-blue-500", content: "Gain a broad understanding of ToolJet's features and capabilities. Learn how it simplifies app development with powerful tools and an intuitive interface." },
    { icon: FileSpreadsheet, title: "Sample Data Source", color: "text-blue-500", content: "Explore sample data sources to quickly integrate with ToolJet. Test features and workflows using predefined datasets." },
    { icon: Folder, title: "Datasource Library", color: "text-blue-500", content: "Browse ToolJet's datasource library to connect with databases, APIs, and external services seamlessly." },
    { icon: Wand2, title: "Transformation", color: "text-blue-500", content: "Leverage ToolJet's transformation capabilities to manipulate and format data from various sources with ease." }
];

export const organizationCards = [
    { icon: LayoutDashboard, title: "Dashboard" },
    { icon: Users, title: "Workspaces" },
    { icon: UserCheck, title: "User authentication" },
    { icon: Lock, title: "Permissions" },
    { icon: UserPlus, title: "Users and groups" },
    { icon: ScrollText, title: "Audit logs" },
    { icon: Megaphone, title: "White label" },
    { icon: Gem, title: "Super admin" },
    { icon: Mail, title: "Licensing" }
];

export const releaseCards = [
    { icon: GitBranch, title: "Git Sync", color: "text-blue-500", content: "Seamlessly sync your ToolJet projects with Git repositories, enabling version control and collaboration across teams." },
    { icon: Box, title: "Multi-Environment", color: "text-blue-500", content: "Easily manage and deploy applications across multiple environments, ensuring smooth transitions between development, staging, and production." },
    { icon: GitMerge, title: "Versioning and Release", color: "text-blue-500", content: "Implement version control and release management to track changes, roll back updates, and maintain stable app deployments." }
];

export const resourceCards = [
    { icon: ShoppingBag, title: "Marketplace", color: "text-green-500", content: "Discover a variety of plugins, templates, and extensions in ToolJet's marketplace to enhance your app-building experience." },
    { icon: Wand, title: "Copilot", color: "text-green-500", content: "Boost productivity with ToolJet Copilot. Get AI-powered suggestions and assistance while building your applications." },
    { icon: Flag, title: "Tracking", color: "text-green-500", content: "Track app performance and user activity with built-in analytics tools, giving you valuable insights to optimize your applications." },
    { icon: ShieldCheck, title: "Security", color: "text-green-500", content: "Keep your data and applications safe with ToolJet's robust security features, including encryption, authentication, and access control." }
];