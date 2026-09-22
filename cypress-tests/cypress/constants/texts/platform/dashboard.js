export const dashboardText = {
  emptyPageHeader: "Welcome to your new ToolJet workspace",
  emptyPageDescription:
    "You can get started by creating a new application or by creating an application using a template in ToolJet Library.",
  createAppButton: "Create new application",
  importAppButton: "Import an app",
  chooseFromTemplate: "Choose from template",
  darkMode: "#808080",
  lightMode: "#fff",
  dropdownText: "My workspace",
  editButton: "Edit",
  manageUsers: "Manage Users",
  manageGroups: "Manage Groups",
  manageSSO: "Manage SSO",
  profileLink: "Profile",
  logoutLink: "Logout",
  changeIconTitle: "Change Icon",
  changeButton: "Change",
  iconUpdatedToast: "Icon updated.",
  iconText: {
    appsIcon: "apps",
    archiveIcon: "archive",
    floppyIcon: "floppy",
    layerIcon: "layer",
    folderUpload: "folder-upload",
    gridIcon: "grid",
    homeIcon: "home",
    sentFastIcon: "sent-fast",
    serverIcon: "server",
    globeIcon: "globe",
    shareIcon: "share",
    shieldIcon: "shield",
    sunIcon: "sun",
    tableIcon: "table",
    menuHomeIcon: "menu-home",
    dragHandleIcon: "drag-handle",
  },
  seeAllAppsTemplateButton: "See all templates",
  addToFolderTitle: "Add to folder",
  appClonedToast: "App cloned successfully!",
  darkModeText: "Dark Mode",
  lightModeText: "Light Mode",
  dashboardAppsHeaderLabel: "All apps",

  moveAppText: (appName) => {
    return `Move "${appName}" to`;
  },
  addToFolderButton: "Add to folder",
  folderName: (folderName) => {
    return folderName;
  },
  homePageDividerText: "OR START WITH",
  homePagePromptHeader: "What do you want to build today?",
  appCardTitle: "Create a blank app",
  appCardDescription: "Build custom apps that make internal processes efficient",
  datasourceCardTitle: "Connect to a data source",
  datasourceCardDescription:
    "Link your tools to existing databases, spreadsheets, APIs, and more",
  workflowCardTitle: "Create a workflow",
  workflowCardDescription:
    "Automate repetitive tasks to streamline business process",
  exploreTemplateCardTitle: "Explore templates",
  exploreTemplateCardDescription:
    "Get started quickly with ready-to-deploy applications",

  // AI-interface home page (new design)
  editorConnectDividerText: "OR USE TOOLJET WITH YOUR CODING AGENT",
  editorConnectCards: [
    {
      id: "claude-code",
      label: "Claude Code",
      description: "Install the plugin to build ToolJet apps from Claude Code",
    },
    {
      id: "codex",
      label: "Codex",
      description: "Install the plugin to build ToolJet apps from Codex",
    },
    {
      id: "grok",
      label: "Grok Build",
      description: "Install the plugin to build ToolJet apps from Grok Build",
    },
    {
      id: "others",
      label: "Others",
      description: "Connect any coding agent via MCP",
    },
  ],
  buildFromEditorModalTitle: "Build ToolJet apps from your coding agent",
  buildFromEditorModalDescription:
    "ToolJet ships an MCP server and a skill, so your coding agent can build and edit ToolJet apps straight from your editor.",
  byoaCreateTokenLinkText: "create a personal access token",
  byoaDocsLinkText: "Read setup guide",
  byoaNotNowButtonText: "Not now",
};
