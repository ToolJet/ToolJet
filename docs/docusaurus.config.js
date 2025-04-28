const devServerPlugin = require('./src/plugins/devServer/index.js');
import versionsArchived from './versionsArchived.json';

const baseArchivedURL = "https://archived-docs.tooljet.com/docs/";

const lastFiveArchivedVersions = versionsArchived
  .slice(0, 5)
  .map((version, index) => ({
    version,
    url: index === 0 ? baseArchivedURL : `${baseArchivedURL}${version}`
  }));

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'ToolJet',
  tagline: 'Low-code framework to Build internal tools and business apps.',
  url: 'https://docs.tooljet.ai',
  baseUrl: '/',
  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/tooljet-ai-favicon.svg',
  organizationName: 'ToolJet', // Usually your GitHub org/user name.
  projectName: 'ToolJet', // Usually your repo name.
  themeConfig: {
    image: 'img/tooljet-ai-og-image.png',
    announcementBar: {
      id: 'support_us',
      content:
        'Star our repository on <a target="_blank" rel="noopener noreferrer" href="https://github.com/ToolJet/ToolJet">GitHub</a> to stay updated with new features and contribute to our platform!',
      backgroundColor: '#ECF0FE',
      textColor: '#4368E3',
      isCloseable: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true
      }
    },
    colorMode: {

    },
    navbar: {
      logo: {
        href: '/docs/',
        alt: 'ToolJet Logo',
        src: 'img/docs_logo.svg',
        srcDark: `img/docs_logo_dark.svg`,
        width: 120
      },
      items: [
        {
          type: 'docsVersionDropdown',
          position: 'left',
        },
        {
          type: 'search',
          position: 'right',
        },
        {
          href: 'https://www.tooljet.ai/',
          position: 'right',
          label: 'Website',
          className: 'navbar-signin',
          'aria-label': 'Visit ToolJet Website',
        },
        {
          href: 'https://www.tooljet.ai/login',
          position: 'right',
          label: 'Sign in',
          className: 'navbar-signin',
          'aria-label': 'Signin to ToolJet',
        },
        {
          href: 'https://www.tooljet.ai/create-account',
          position: 'right',
          label: 'Try for free',
          className: 'navbar-website',
          'aria-label': 'Try ToolJet for free',
        },
      ],
    },
    footer: {
      style: 'light', 
      logo: {
        alt: 'ToolJet Logo',
        src: 'img/docs_logo.svg',
        srcDark: 'img/docs_logo_dark.svg',
      },
      links: [
        {
          title: 'Platform',
          items: [
            { label: 'App builder', to: 'https://www.tooljet.ai/visual-app-builder' },
            { label: 'AI Agent builder', to: 'https://www.tooljet.ai/ai-agent-builder' },
            { label: 'ToolJet Database', to: 'https://www.tooljet.ai/database' },
          ],
        },
        {
          title: 'Solutions',
          items: [
            { label: 'Back office tools', to: 'https://www.tooljet.ai/building-back-office-apps' },
            { label: 'Business applications', to: 'https://www.tooljet.ai/business-applications' },
          ],
        },
        {
          title: 'Developers',
          items: [
            { label: 'Blogs', to: 'https://blog.tooljet.ai/' },
            { label: 'Events', to: 'https://www.tooljet.ai/events' },
            { label: 'GitHub', href: 'https://github.com/ToolJet/ToolJet' },
            { label: 'Slack', href: 'https://tooljet.ai/slack' },
          ],
        },
        {
          title: 'Templates',
          items: [
            { label: 'Lead management', to: 'https://www.tooljet.ai/templates/lead-management-system' },
            { label: 'KPI management', to: 'https://www.tooljet.ai/templates/kpi-management-dashboard' },
            { label: 'Inventory management', to: 'https://www.tooljet.ai/templates/inventory-management-system' },
            { label: 'Leave management', to: 'https://www.tooljet.ai/templates/leave-management-portal' },
            { label: 'Applicant tracking', to: 'https://www.tooljet.ai/templates/applicant-tracking-system' },
          ],
        },
        {
          title: 'Contact us',
          items: [
            { label: 'hello@tooljet.com', href: 'mailto:hello@tooljet.com' },
            { label: 'support@tooljet.com', href: 'mailto:support@tooljet.com' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ToolJet Solutions, Inc. All rights reserved.
      <img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=4f00afac-ae1f-4cf6-8c53-8a2c7b3ca206" />
      <script>window.faitracker=window.faitracker||function(){this.q=[];var t=new CustomEvent("FAITRACKER_QUEUED_EVENT");return this.init=function(t,e,a){this.TOKEN=t,this.INIT_PARAMS=e,this.INIT_CALLBACK=a,window.dispatchEvent(new CustomEvent("FAITRACKER_INIT_EVENT"))},this.call=function(){var e={k:"",a:[]};if(arguments&&arguments.length>=1){for(var a=1;a<arguments.length;a++)e.a.push(arguments[a]);e.k=arguments[0]}this.q.push(e),window.dispatchEvent(t)},this.message=function(){window.addEventListener("message",function(t){"faitracker"===t.data.origin&&this.call("message",t.data.type,t.data.message)})},this.message(),this.init("c4rgfujgx6jef4722rcjfhj7dlmcipih",{host:"https://api.factors.ai"}),this}(),function(){var t=document.createElement("script");t.type="text/javascript",t.src="https://app.factors.ai/assets/factors.js",t.async=!0,(d=document.getElementsByTagName("script")[0]).parentNode.insertBefore(t,d)}();</script>
      <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src= 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-5L8R522S');</script>
      <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5L8R522S" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
      `,
    },    
    algolia: {
      appId: 'O8HQRLI0WA',
      apiKey: process.env.ALGOLIA_API_KEY || 'development', // Public API key: it is safe to commit it
      indexName: 'tooljet',
      contextualSearch: true,
      externalUrlRegex: 'external\\.com|domain\\.com',
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/ToolJet/Tooljet/blob/develop/docs/',
          includeCurrentVersion: true,
          lastVersion: '3.0.0-LTS',
          versions: {
            current: {
              label: '3.1.0-Beta 🚧',
              path: 'beta',
              banner: 'none',
              badge: false
            },
            "2.50.0-LTS": {
              banner: 'none',
              badge: false
            },
            "3.0.0-LTS": {
              banner: 'none',
              badge: false
            }
          }
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/docs/1.x.x/**'],
          filename: 'sitemap.xml',
        },
        googleTagManager: isProd
          ? {
            containerId: process.env.GTM || 'development',
          }
          : undefined,
      },
    ],
  ],
  plugins: [
    devServerPlugin,
    'plugin-image-zoom',
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            to: '/docs/',
            from: '/',
          },
          {
            to: '/docs/security/constants/',
            from: '/docs/org-management/workspaces/workspace_constants/',
          },
          {
            to: '/docs/development-lifecycle/gitsync/overview',
            from: '/docs/gitsync',
          },
          {
            to: '/docs/user-management/role-based-access/access-control',
            from: '/docs/tutorial/manage-users-groups',
          },
          {
            to: '/docs/security/constants/variables',
            from: '/docs/org-management/workspaces/workspace-variables-migration',
          },
          {
            to: '/docs/tj-setup/smtp-setup/configuration',
            from: '/docs/org-management/smtp-configuration/',
          },
          {
            to: '/docs/user-management/authentication/self-hosted/instance-login',
            from: '/docs/enterprise/superadmin',
          },
          {
            to: '/docs/beta/user-management/sso/oidc/setup',
            from: '/docs/beta/category/openid-connect/',
          },
          {
            to: '/docs/beta/development-lifecycle/release/share-app/',
            from: '/docs/beta/dashboard',
          },
          {
            to: '/docs/beta/security/audit-logs',
            from: '/docs/beta/enterprise/audit_logs',
          },
          {
            to: '/docs/beta/user-management/role-based-access/super-admin',
            from: '/docs/beta/enterprise/superadmin',
          },
          {
            to: '/docs/beta/tj-setup/org-branding/white-labeling',
            from: '/docs/beta/enterprise/white-label',
          },
          {
            to: '/docs/beta/development-lifecycle/gitsync/overview',
            from: '/docs/beta/gitsync',
          },
          {
            to: '/docs/beta/tj-setup/licensing/self-hosted',
            from: '/docs/beta/org-management/licensing/self-hosted/',
          },
          {
            to: '/docs/beta/user-management/role-based-access/access-control',
            from: '/docs/beta/org-management/permissions',
          },
          {
            to: '/docs/beta/tj-setup/smtp-setup/configuration',
            from: '/docs/beta/org-management/smtp-configuration',
          },
          {
            to: '/docs/beta/security/constants/',
            from: '/docs/beta/org-management/workspaces/workspace_constants/',
          },
          {
            to: '/docs/beta/tj-setup/workspaces',
            from: '/docs/beta/org-management/workspaces/workspace_overview/',
          },
          {
            to: '/docs/beta/security/constants/variables',
            from: '/docs/beta/org-management/workspaces/workspace-variables-migration',
          },
          {
            to: '/docs/beta/development-lifecycle/gitsync/pull',
            from: '/docs/beta/release-management/gitsync/git-pull',
          },
          {
            to: '/docs/beta/development-lifecycle/gitsync/gitsync-config',
            from: '/docs/beta/release-management/gitsync/tj-config/',
          },
          {
            to: '/docs/beta/security/compliance',
            from: '/docs/beta/security',
          },
          {
            to: '/docs/beta/build-with-ai/overview',
            from: '/docs/beta/tooljet-copilot',
          },
          {
            to: '/docs/beta/user-management/role-based-access/custom-groups',
            from: '/docs/beta/tutorial/manage-users-groups',
          },
          {
            to: '/docs/beta/tooljet-api',
            from: '/docs/beta/tutorial/tooljet-api',
          },
          {
            to: '/docs/beta/user-management/authentication/self-hosted/overview',
            from: '/docs/beta/user-authentication/general-settings/',
          },
          {
            to: '/docs/beta/user-management/authentication/self-hosted/instance-login',
            from: '/docs/beta/user-authentication/password-login',
          },
          {
            to: '/docs/beta/user-management/authentication/self-hosted/instance-login',
            from: '/docs/beta/user-authentication/sso/auto-sso-login',
          },
          {
            to: '/docs/user-management/sso/github',
            from: '/docs/beta/user-authentication/sso/github',
          },
          {
            to: '/docs/user-management/sso/ldap',
            from: '/docs/beta/user-authentication/sso/ldap',
          },
          {
            to: '/docs/beta/user-management/sso/oidc/azuread',
            from: '/docs/beta/user-authentication/sso/openid/azuread/',
          },
          {
            to: '/docs/beta/user-management/sso/oidc/google',
            from: '/docs/beta/user-authentication/sso/openid/google-openid',
          },
          {
            to: '/docs/beta/user-management/sso/oidc/okta',
            from: '/docs/beta/user-authentication/sso/openid/okta',
          },
          {
            to: '/docs/beta/user-management/sso/saml/setup',
            from: '/docs/beta/user-authentication/sso/saml',
          },
          {
            to: '/docs/beta/user-management/onboard-users/overview',
            from: '/docs/beta/user-authentication/user-lifecycle/',
          },
          {
            to: '/docs/beta/user-management/authentication/self-hosted/workspace-login',
            from: '/docs/beta/user-authentication/workspace-login',
          },
          {
            to: '/docs/user-management/sso/oidc/setup',
            from: '/docs/category/openid-connect',
          },
          {
            to: '/docs/development-lifecycle/release/share-app',
            from: '/docs/dashboard',
          },
          {
            to: '/docs/security/audit-logs',
            from: '/docs/enterprise/audit_logs/',
          },
          {
            to: '/docs/tj-setup/org-branding/white-labeling',
            from: '/docs/enterprise/white-label',
          },
          {
            to: '/docs/tj-setup/licensing/self-hosted',
            from: '/docs/org-management/licensing/self-hosted',
          },
          {
            to: '/docs/user-management/role-based-access/access-control',
            from: '/docs/org-management/permissions/',
          },
          {
            to: '/docs/tj-setup/workspaces',
            from: '/docs/org-management/workspaces/workspace_overview',
          },
          {
            to: '/docs/security/constants/variables',
            from: '/docs/org-management/workspaces/workspace-variables',
          },
          {
            to: '/docs/development-lifecycle/gitsync/delete-gitsync',
            from: '/docs/release-management/gitsync/delete-gitsync',
          },
          {
            to: '/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config',
            from: '/docs/release-management/gitsync/ssh-config',
          },
          {
            to: '/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/gitsync-config',
            from: '/docs/release-management/gitsync/tj-config',
          },
          {
            to: '/docs/development-lifecycle/environment/self-hosted/multi-environment',
            from: '/docs/release-management/multi-environment',
          },
          {
            to: '/docs/security/compliance',
            from: '/docs/security/',
          },
          {
            to: '/docs/setup/try-tooljet/',
            from: '/docs/setup/client/',
          },
          {
            to: '/docs/build-with-ai/overview',
            from: '/docs/tooljet-ai/overview',
          },
          {
            to: '/docs/tooljet-api',
            from: '/docs/tutorial/tooljet-api',
          },
          {
            to: '/docs/user-management/authentication/self-hosted/overview',
            from: '/docs/user-authentication/general-settings',
          },
          {
            to: '/docs/user-management/authentication/self-hosted/instance-login',
            from: '/docs/user-authentication/password-login',
          },
          {
            to: '/docs/user-management/sso/github',
            from: '/docs/user-authentication/sso/github',
          },
          {
            to: '/docs/user-management/sso/google',
            from: '/docs/user-authentication/sso/google',
          },
          {
            to: '/docs/user-management/sso/oidc/setup',
            from: '/docs/user-authentication/sso/oidc',
          },
          {
            to: '/docs/user-management/sso/oidc/azuread',
            from: '/docs/user-authentication/sso/openid/azuread/',
          },
          {
            to: '/docs/user-management/sso/oidc/google',
            from: '/docs/user-authentication/sso/openid/google-openid',
          },
          {
            to: '/docs/user-management/sso/oidc/okta',
            from: '/docs/user-authentication/sso/openid/okta',
          },
          {
            to: '/docs/user-management/sso/oidc/setup',
            from: '/docs/user-authentication/sso/openid/setup',
          },
          {
            to: '/docs/user-management/sso/saml/setup',
            from: '/docs/user-authentication/sso/saml',
          },
          {
            to: '/docs/user-management/onboard-users/overview',
            from: '/docs/user-authentication/user-lifecycle/',
          },
          {
            to: '/docs/user-management/authentication/self-hosted/workspace-login',
            from: '/docs/user-authentication/workspace-login',
          },
          {
            to: '/docs/widgets/table/',
            from: '/docs/widgets/table/table-properties',
          },
          {
            to: '/docs/workflows/how-to/trigger-workflow-from-app',
            from: '/docs/workflows/trigger-workflow-from-app',
          }
        ],
      },
    ],
  ],
};