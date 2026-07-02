// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  evaluate: [
    {
      type: 'link',
      label: '← Back to Docs',
      href: '/docs',
      className: 'sidebar-back-to-docs',
    },
    { type: 'doc', id: 'index', label: 'Evaluation Guide' },
    {
      type: 'category',
      label: 'Platform Foundation',
      className: 'category-as-header no-icon',
      collapsed: false,
      collapsible: false,
      items: [
        { type: 'doc', id: 'platform-overview', label: 'Platform Overview' },
        { type: 'doc', id: 'app-builder', label: 'App Builder & Components' },
      ],
    },
    {
      type: 'category',
      label: 'Data & Automation',
      className: 'category-as-header no-icon',
      collapsed: false,
      collapsible: false,
      items: [
        { type: 'doc', id: 'ai-development', label: 'AI Development' },
        { type: 'doc', id: 'integrations', label: 'Integrations & Data Sources' },
        { type: 'doc', id: 'workflows', label: 'Workflow Automation' },
      ],
    },
    {
      type: 'category',
      label: 'Enterprise Readiness',
      className: 'category-as-header no-icon',
      collapsed: false,
      collapsible: false,
      items: [
        { type: 'doc', id: 'deployment', label: 'Deployment & Infrastructure' },
        { type: 'doc', id: 'governance', label: 'Governance & Access Control' },
        { type: 'doc', id: 'user-management-eval', label: 'User & Workspace Management' },
      ],
    },
    {
      type: 'category',
      label: 'Engineering Confidence',
      className: 'category-as-header no-icon',
      collapsed: false,
      collapsible: false,
      items: [
        { type: 'doc', id: 'development-lifecycle-eval', label: 'Development Lifecycle' },
        { type: 'doc', id: 'security-compliance', label: 'Security & Compliance' },
      ],
    },
    {
      type: 'category',
      label: 'Decision Support',
      className: 'category-as-header no-icon',
      collapsed: false,
      collapsible: false,
      items: [
        { type: 'doc', id: 'roadmap', label: 'Roadmap & Vision' },
        { type: 'doc', id: 'compare', label: 'Compare & Choose' },
      ],
    },
  ],
};

module.exports = sidebars;
